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

/** Phân trang sections theo topicSlug */
export async function listSectionsByTopicSlugPaginated(
  topicSlug: string,
  page = 1,
  limit = 5,
) {
  const skip = (page - 1) * limit;

  const [sections, total, sidebarItem] = await Promise.all([
    prisma.section.findMany({
      where: { topicSlug },
      orderBy: { idx: "asc" },
      skip,
      take: limit,
      select: SECTION_SELECT_WITH_POSTS,
    }),
    prisma.section.count({ where: { topicSlug } }),
    prisma.sidebarItem.findFirst({
      where: { slug: topicSlug },
      select: {
        name: true,
        description: true,
        topics: { select: { id: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const topicInfo = sidebarItem
    ? { name: sidebarItem.name, description: sidebarItem.description ?? "" }
    : null;

  // When no sections, return posts linked to the topic directly
  if (total === 0 && sidebarItem?.topics?.length) {
    const topicIds = sidebarItem.topics.map((t) => t.id);
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

  return {
    data: sections.map(serializeSection),
    meta: { page, limit, total, totalPages },
    topic: topicInfo,
    topicPosts: null,
  };
}
