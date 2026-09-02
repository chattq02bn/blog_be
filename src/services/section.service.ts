import { prisma } from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import { POST_SELECT, serializePost } from "./post.service.js";

const SECTION_SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  idx: true,
  topicSlug: true,
} as const;

const SECTION_SELECT_WITH_POSTS = {
  ...SECTION_SELECT,
  posts: {
    where: { status: "PUBLISHED" },
    select: POST_SELECT,
    orderBy: { createdAt: "desc" },
  },
} as const;

function serializeSection(section: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  idx: number;
  topicSlug: string;
  posts?: Parameters<typeof serializePost>[0][];
}) {
  return {
    id: section.id,
    slug: section.slug,
    title: section.title,
    description: section.description ?? "",
    idx: section.idx,
    topicSlug: section.topicSlug,
    ...(section.posts ? { posts: section.posts.map(serializePost) } : {}),
  };
}

export async function getSectionById(id: string) {
  const section = await prisma.section.findUnique({
    where: { id },
    select: SECTION_SELECT,
  });

  if (!section) {
    throw ApiError.notFound("Section not found");
  }

  return serializeSection(section);
}

export async function listSectionsByTopicSlug(topicSlug: string) {
  const sections = await prisma.section.findMany({
    where: { topicSlug },
    orderBy: { idx: "asc" },
    select: SECTION_SELECT_WITH_POSTS,
  });

  if (sections.length === 0) {
    throw ApiError.notFound("No sections found for this topic");
  }

  return sections.map(serializeSection);
}

/** Lấy sections của nhiều topicSlug một lúc (dùng cho trang mục cha gom sections của các mục con) */
export async function listSectionsByTopicSlugs(slugs: string[]) {
  const sections = await prisma.section.findMany({
    where: { topicSlug: { in: slugs } },
    orderBy: [{ topicSlug: "asc" }, { idx: "asc" }],
    select: SECTION_SELECT_WITH_POSTS,
  });

  const order = new Map(slugs.map((slug, index) => [slug, index]));
  return sections
    .sort(
      (a, b) =>
        (order.get(a.topicSlug) ?? Number.MAX_SAFE_INTEGER) -
          (order.get(b.topicSlug) ?? Number.MAX_SAFE_INTEGER) ||
        a.idx - b.idx
    )
    .map(serializeSection);
}

/** Phân trang sections theo topicSlug hoặc sidebarId */
export async function listSectionsByTopicSlugPaginated(
  topicSlug: string,
  page = 1,
  limit = 5,
  sidebarId?: string,
) {
  const sidebarItem = sidebarId
    ? await prisma.sidebarItem.findUnique({
        where: { id: sidebarId },
        select: {
          name: true,
          slug: true,
          description: true,
          topics: { select: { id: true } },
          children: {
            select: {
              topics: { select: { id: true } },
            },
          },
        },
      })
    : await prisma.sidebarItem.findFirst({
        where: { slug: topicSlug },
        select: {
          name: true,
          slug: true,
          description: true,
          topics: { select: { id: true } },
          children: {
            select: {
              topics: { select: { id: true } },
            },
          },
        },
      });

  const topicSlugActual = sidebarItem?.slug ?? topicSlug;

  // Collect all topic IDs: parent + all children
  const allTopicIds: string[] = [];
  if (sidebarItem) {
    for (const t of sidebarItem.topics) allTopicIds.push(t.id);
    for (const child of sidebarItem.children) {
      for (const t of child.topics) allTopicIds.push(t.id);
    }
  }

  // Sections are linked by topicSlug (= sidebar item slug), not topic ID
  const [sections, total] = await Promise.all([
    prisma.section.findMany({
      where: { topicSlug: topicSlugActual },
      orderBy: { idx: "asc" },
      select: SECTION_SELECT_WITH_POSTS,
    }),
    prisma.section.count({ where: { topicSlug: topicSlugActual } }),
  ]);

  const topicInfo = sidebarItem
    ? { name: sidebarItem.name, description: sidebarItem.description ?? "" }
    : null;

  // Check if there are posts via any of those topics
  let virtualSection: ReturnType<typeof serializeSection> | null = null;
  if (allTopicIds.length > 0) {
    const parentPostCount = await prisma.post.count({
      where: {
        topics: { some: { id: { in: allTopicIds } } },
        status: "PUBLISHED",
      },
    });

    if (parentPostCount > 0) {
      const virtualPosts = await prisma.post.findMany({
        where: {
          topics: { some: { id: { in: allTopicIds } } },
          status: "PUBLISHED",
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: POST_SELECT,
      });

      virtualSection = serializeSection({
        id: `topic-${topicSlugActual}`,
        slug: topicSlugActual,
        title: `Danh sách ${sidebarItem!.name}`,
        description: sidebarItem!.description ?? "",
        idx: -1,
        topicSlug: topicSlugActual,
        posts: virtualPosts,
      });
    }
  }

  const hasVirtual = virtualSection !== null;
  const totalSections = total + (hasVirtual ? 1 : 0);
  const totalPages = Math.ceil(totalSections / limit);

  // Get total post count from all topics (parent + children)
  let topicPostCount = 0;
  if (allTopicIds.length > 0) {
    topicPostCount = await prisma.post.count({
      where: {
        topics: { some: { id: { in: allTopicIds } } },
        status: "PUBLISHED",
      },
    });
  }

  // When no sections and no virtual section, return posts linked to the topic directly
  if (total === 0 && !hasVirtual && sidebarItem?.topics?.length) {
    const topicIds = sidebarItem.topics.map((t) => t.id);
    const skip = (page - 1) * limit;
    const [topicPosts, postCount] = await Promise.all([
      prisma.post.findMany({
        where: {
          topics: { some: { id: { in: topicIds } } },
          status: "PUBLISHED",
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: POST_SELECT,
      }),
      prisma.post.count({
        where: {
          topics: { some: { id: { in: topicIds } } },
          status: "PUBLISHED",
        },
      }),
    ]);

    return {
      data: [],
      meta: { page, limit, total: postCount, totalPages: Math.ceil(postCount / limit) },
      topic: topicInfo,
      topicPosts: topicPosts.map(serializePost),
    };
  }

  // Paginate real sections, accounting for virtual section on page 1
  const sectionSkip = hasVirtual && page === 1
    ? Math.max(0, (page - 1) * limit - 1)
    : (page - 1) * limit;
  const paginatedSections = sections.slice(sectionSkip, sectionSkip + limit);

  const data = hasVirtual && page === 1
    ? [virtualSection!, ...paginatedSections.map(serializeSection)]
    : paginatedSections.map(serializeSection);

  return {
    data,
    meta: { page, limit, total: totalSections, totalPages },
    topic: topicInfo,
    topicPosts: null,
    topicPostCount,
  };
}

/** Lấy tất cả bài viết của topic (virtual section "Danh sách ...") — phân trang */
export async function listTopicPosts(
  topicSlug: string,
  page = 1,
  limit = 12,
  sidebarId?: string,
) {
  const sidebarItem = sidebarId
    ? await prisma.sidebarItem.findUnique({
        where: { id: sidebarId },
        select: {
          name: true,
          slug: true,
          description: true,
          topics: { select: { id: true } },
          children: {
            select: {
              topics: { select: { id: true } },
            },
          },
        },
      })
    : await prisma.sidebarItem.findFirst({
        where: { slug: topicSlug },
        select: {
          name: true,
          slug: true,
          description: true,
          topics: { select: { id: true } },
          children: {
            select: {
              topics: { select: { id: true } },
            },
          },
        },
      });

  // Collect all topic IDs: parent + all children
  const allTopicIds: string[] = [];
  if (sidebarItem) {
    for (const t of sidebarItem.topics) allTopicIds.push(t.id);
    for (const child of sidebarItem.children) {
      for (const t of child.topics) allTopicIds.push(t.id);
    }
  }

  const slugActual = sidebarItem?.slug ?? topicSlug;

  if (!sidebarItem || allTopicIds.length === 0) {
    return {
      data: [] as ReturnType<typeof serializePost>[],
      meta: { page, limit, total: 0, totalPages: 0 },
      section: { id: `topic-${slugActual}`, slug: slugActual, title: `Danh sách ${slugActual}`, description: "", idx: 0, topicSlug: slugActual },
    };
  }

  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: {
        topics: { some: { id: { in: allTopicIds } } },
        status: "PUBLISHED",
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: POST_SELECT,
    }),
    prisma.post.count({
      where: {
        topics: { some: { id: { in: allTopicIds } } },
        status: "PUBLISHED",
      },
    }),
  ]);

  return {
    data: posts.map(serializePost),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    section: {
      id: `topic-${slugActual}`,
      slug: slugActual,
      title: `Danh sách ${sidebarItem.name}`,
      description: sidebarItem.description ?? "",
      idx: 0,
      topicSlug: slugActual,
    },
  };
}
