import { prisma } from "../config/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import ApiError from "../utils/ApiError.js";
import { slugify } from "../utils/slugify.js";
import { logger } from "../utils/logger.js";
import type { AuthUser } from "../types/auth.types.js";
import type {
  CreatePostInput,
  ListPostsQuery,
  UpdatePostInput,
} from "../validations/post.validation.js";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover?: string | null;
  bodyBlocks?: unknown;
  status: "DRAFT" | "PUBLISHED";
  likes: number;
  bookmarks: number;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  sidebarId?: string | null;
  author?: { id: number; name: string | null; email: string; avatar?: string | null; description?: string | null } | null;
  sidebar?: { id: string; name: string; slug: string } | null;
  topics?: { id: string; name: string }[] | null;
  tags?: { id: string; name: string }[] | null;
  _count?: { comments: number } | null;
};

const POST_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  cover: true,
  bodyBlocks: true,
  status: true,
  likes: true,
  bookmarks: true,
  authorId: true,
  sidebarId: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, name: true, email: true, avatar: true, description: true } },
  sidebar: { select: { id: true, name: true, slug: true } },
  topics: { select: { id: true, name: true }, orderBy: { name: "asc" as const } },
  tags: { select: { id: true, name: true }, orderBy: { name: "asc" as const } },
  _count: { select: { comments: true } },
} as const;

export { POST_SELECT };

export type SerializedPost = ReturnType<typeof serializePost>;

export function serializePost(post: PostRow) {
  const author = post.author ?? null;

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? null,
    cover: post.cover ?? null,
    bodyBlocks: post.bodyBlocks ?? [],
    status: post.status === "PUBLISHED" ? ("published" as const) : ("draft" as const),
    likes: post.likes,
    bookmarks: post.bookmarks,
    commentsCount: post._count?.comments ?? 0,
    topicIds: (post.topics ?? []).map((topic) => topic.id),
    tagIds: (post.tags ?? []).map((tag) => tag.id),
    topics: post.topics ?? [],
    tags: post.tags ?? [],
    sidebarId: post.sidebarId ?? null,
    sidebar: post.sidebar ?? null,
    author,
    authorAvatar: author?.avatar ?? null,
    authorName: author ? (author.name ?? author.email) : "Ẩn danh",
    authorDescription: author?.description ?? null,
    date: post.createdAt.toISOString().slice(0, 10),
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

function ensureCanManage(post: { authorId: number }, requester: AuthUser): void {
  if (post.authorId !== requester.id && requester.role !== "ADMIN") {
    throw ApiError.forbidden("You are not allowed to modify this post");
  }
}

async function uniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title) || "post";
  let candidate = base;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await prisma.post.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) {
      return candidate;
    }
    candidate = `${base}-${Math.random().toString(36).slice(2, 7)}`;
  }

  return `${base}-${Date.now().toString(36)}`;
}

function buildWhere(query: ListPostsQuery) {
  const where: Record<string, unknown> = {};

  if (query.status) {
    where.status = query.status === "published" ? "PUBLISHED" : "DRAFT";
  }
  if (query.authorId !== undefined) {
    where.authorId = query.authorId;
  }
  if (query.topicId) {
    where.topics = { some: { id: query.topicId } };
  }
  if (query.topicIds) {
    const ids = query.topicIds.split(",").map((id) => id.trim()).filter(Boolean);
    if (ids.length > 0) {
      // Ghi đè điều kiện topicId đơn nếu có cả hai — ưu tiên danh sách nhiều topic.
      where.topics = { some: { id: { in: ids } } };
    }
  }
  if (query.tagId) {
    where.tags = { some: { id: query.tagId } };
  }
  if (query.sidebarId) {
    where.sidebarId = query.sidebarId;
  }
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" as const } },
      { excerpt: { contains: query.q, mode: "insensitive" as const } },
    ];
  }

  return where;
}

async function createPost(authorId: number, input: CreatePostInput) {
  const slug = await uniqueSlug(input.title);

  if (input.sidebarId) {
    const exists = await prisma.sidebarItem.findUnique({ where: { id: input.sidebarId }, select: { id: true, name: true } });
    if (!exists) {
      logger.warn("[post.create] Sidebar not found:", input.sidebarId);
      throw ApiError.badRequest("Sidebar not found");
    }
  }
  if (input.topicIds.length > 0) {
    const count = await prisma.topic.count({ where: { id: { in: input.topicIds } } });
    if (count !== input.topicIds.length) {
      logger.warn("[post.create] Topics not found:", input.topicIds);
      throw ApiError.badRequest("One or more topics not found");
    }
  }
  if (input.tagIds.length > 0) {
    const count = await prisma.tag.count({ where: { id: { in: input.tagIds } } });
    if (count !== input.tagIds.length) {
      logger.warn("[post.create] Tags not found:", input.tagIds);
      throw ApiError.badRequest("One or more tags not found");
    }
  }

  // Xác định topicIds cuối cùng: nếu không chọn topic nào nhưng có sidebarId,
  // tự động tìm hoặc tạo topic "Danh_something" cho sidebar đó
  let finalTopicIds = input.topicIds;
  if (finalTopicIds.length === 0 && input.sidebarId) {
    const sidebar = await prisma.sidebarItem.findUnique({
      where: { id: input.sidebarId },
      select: { id: true, name: true, slug: true },
    });
    if (sidebar) {
      const topicName = `Danh_something ${sidebar.name}`;
      // Tìm topic đã tồn tại trong sidebar này
      const existingTopic = await prisma.topic.findFirst({
        where: {
          name: topicName,
          sidebarItems: { some: { id: sidebar.id } },
        },
        select: { id: true },
      });

      if (existingTopic) {
        finalTopicIds = [existingTopic.id];
      } else {
        // Tạo topic mới và gán cho sidebar
        const newTopic = await prisma.topic.create({
          data: {
            name: topicName,
            sidebarItems: { connect: { id: sidebar.id } },
          },
          select: { id: true },
        });
        finalTopicIds = [newTopic.id];
      }
    }
  }

  const post = await prisma.post.create({
    data: {
      title: input.title,
      slug,
      excerpt: input.excerpt ?? null,
      cover: input.cover ?? null,
      bodyBlocks: input.bodyBlocks as unknown as Prisma.InputJsonValue[],
      status: input.status === "published" ? "PUBLISHED" : "DRAFT",
      authorId,
      sidebarId: input.sidebarId ?? null,
      ...(finalTopicIds.length > 0 ? { topics: { connect: finalTopicIds.map((id) => ({ id })) } } : {}),
      ...(input.tagIds.length > 0 ? { tags: { connect: input.tagIds.map((id) => ({ id })) } } : {}),
    },
    select: POST_SELECT,
  });

  return serializePost(post);
}

async function listPosts(query: ListPostsQuery) {
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;
  const where = buildWhere(query);

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      select: POST_SELECT,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    data: posts.map(serializePost),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

async function getPostByIdOrSlug(idOrSlug: string) {
  const isNumericCuid = /^[a-z0-9]{20,}$/i.test(idOrSlug);
  const post = await prisma.post.findFirst({
    where: isNumericCuid ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }] } : { slug: idOrSlug },
    select: POST_SELECT,
  });

  if (!post) {
    throw ApiError.notFound("Post not found");
  }

  return serializePost(post);
}

async function updatePost(id: string, requester: AuthUser, input: UpdatePostInput) {
  const existing = await prisma.post.findUnique({ where: { id }, select: { authorId: true, sidebarId: true } });

  if (!existing) {
    throw ApiError.notFound("Post not found");
  }

  ensureCanManage(existing, requester);

  if (input.sidebarId !== undefined && input.sidebarId !== null) {
    const exists = await prisma.sidebarItem.findUnique({ where: { id: input.sidebarId }, select: { id: true, name: true } });
    if (!exists) {
      logger.warn("[post.update] Sidebar not found:", input.sidebarId);
      throw ApiError.badRequest("Sidebar not found");
    }
  }
  if (input.topicIds !== undefined && input.topicIds.length > 0) {
    const count = await prisma.topic.count({ where: { id: { in: input.topicIds } } });
    if (count !== input.topicIds.length) {
      logger.warn("[post.update] Topics not found:", input.topicIds);
      throw ApiError.badRequest("One or more topics not found");
    }
  }
  if (input.tagIds !== undefined && input.tagIds.length > 0) {
    const count = await prisma.tag.count({ where: { id: { in: input.tagIds } } });
    if (count !== input.tagIds.length) {
      logger.warn("[post.update] Tags not found:", input.tagIds);
      throw ApiError.badRequest("One or more tags not found");
    }
  }

  // Xác định topicIds cuối cùng: nếu không chọn topic nào nhưng có sidebarId,
  // tự động tìm hoặc tạo topic "Danh_something" cho sidebar đó
  let finalTopicIds = input.topicIds;
  const sidebarIdToUse = input.sidebarId !== undefined ? input.sidebarId : existing.sidebarId;
  if (finalTopicIds !== undefined && finalTopicIds.length === 0 && sidebarIdToUse) {
    const sidebar = await prisma.sidebarItem.findUnique({
      where: { id: sidebarIdToUse },
      select: { id: true, name: true, slug: true },
    });
    if (sidebar) {
      const topicName = `Danh_something ${sidebar.name}`;
      const existingTopic = await prisma.topic.findFirst({
        where: {
          name: topicName,
          sidebarItems: { some: { id: sidebar.id } },
        },
        select: { id: true },
      });

      if (existingTopic) {
        finalTopicIds = [existingTopic.id];
      } else {
        const newTopic = await prisma.topic.create({
          data: {
            name: topicName,
            sidebarItems: { connect: { id: sidebar.id } },
          },
          select: { id: true },
        });
        finalTopicIds = [newTopic.id];
      }
    }
  }

  const data: Record<string, unknown> = {
    ...(input.title !== undefined ? { title: input.title, slug: await uniqueSlug(input.title, id) } : {}),
    ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
    ...(input.cover !== undefined ? { cover: input.cover } : {}),
    ...(input.bodyBlocks !== undefined ? { bodyBlocks: input.bodyBlocks } : {}),
    ...(input.status !== undefined
      ? { status: input.status === "published" ? "PUBLISHED" : "DRAFT" }
      : {}),
    ...(input.sidebarId !== undefined ? { sidebarId: input.sidebarId ?? null } : {}),
    ...(finalTopicIds !== undefined ? { topics: { set: finalTopicIds.map((tid) => ({ id: tid })) } } : {}),
    ...(input.tagIds !== undefined ? { tags: { set: input.tagIds.map((tid) => ({ id: tid })) } } : {}),
  };

  const post = await prisma.post.update({ where: { id }, data, select: POST_SELECT });
  return serializePost(post);
}

async function deletePost(id: string, requester: AuthUser): Promise<void> {
  const existing = await prisma.post.findUnique({ where: { id }, select: { authorId: true } });

  if (!existing) {
    throw ApiError.notFound("Post not found");
  }

  ensureCanManage(existing, requester);
  await prisma.post.delete({ where: { id } });
}

async function toggleCounter(id: string, field: "likes" | "bookmarks", active: boolean, commenterId?: number) {
  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, likes: true, bookmarks: true },
  });

  if (!post) {
    throw ApiError.notFound("Post not found");
  }

  if (field === "likes" && commenterId) {
    if (active) {
      await prisma.postLike.upsert({
        where: { postId_commenterId: { postId: id, commenterId } },
        create: { postId: id, commenterId },
        update: {},
      });
    } else {
      await prisma.postLike.deleteMany({
        where: { postId: id, commenterId },
      });
    }
    const actualCount = await prisma.postLike.count({ where: { postId: id } });
    return prisma.post.update({
      where: { id },
      data: { likes: actualCount },
      select: { id: true, likes: true, bookmarks: true },
    });
  }

  const next = active ? post[field] + 1 : Math.max(0, post[field] - 1);

  return prisma.post.update({
    where: { id },
    data: { [field]: next },
    select: { id: true, likes: true, bookmarks: true },
  });
}

async function getLikedPostIds(commenterId: number, postIds: string[]): Promise<string[]> {
  if (postIds.length === 0) return [];
  const likes = await prisma.postLike.findMany({
    where: { commenterId, postId: { in: postIds } },
    select: { postId: true },
  });
  return likes.map((l) => l.postId);
}

async function togglePostLike(postId: string, commenterId: number) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, likes: true },
  });
  if (!post) throw ApiError.notFound("Post not found");

  return prisma.$transaction(async (tx) => {
    const existing = await tx.postLike.findUnique({
      where: { postId_commenterId: { postId, commenterId } },
      select: { id: true, isActive: true },
    });

    let isLiked: boolean;

    if (existing) {
      isLiked = !existing.isActive;
      await tx.postLike.update({
        where: { id: existing.id },
        data: { isActive: isLiked },
      });
    } else {
      isLiked = true;
      await tx.postLike.create({
        data: { postId, commenterId, isActive: true },
      });
    }

    const likeCount = isLiked ? post.likes + 1 : Math.max(0, post.likes - 1);

    await tx.post.update({
      where: { id: postId },
      data: { likes: likeCount },
    });

    return { isLiked, likeCount };
  });
}

async function getPostLikeState(postId: string, commenterId?: number) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, likes: true },
  });
  if (!post) throw ApiError.notFound("Post not found");

  let isLiked = false;
  if (commenterId) {
    const like = await prisma.postLike.findUnique({
      where: { postId_commenterId: { postId, commenterId } },
      select: { isActive: true },
    });
    isLiked = like?.isActive ?? false;
  }

  return { isLiked, likeCount: post.likes };
}

async function getBulkLikeStates(postIds: string[], commenterId?: number): Promise<Record<string, { isLiked: boolean; likeCount: number }>> {
  if (postIds.length === 0) return {};

  const posts = await prisma.post.findMany({
    where: { id: { in: postIds } },
    select: { id: true, likes: true },
  });

  let likedSet = new Set<string>();
  if (commenterId && postIds.length > 0) {
    const likes = await prisma.postLike.findMany({
      where: { commenterId, postId: { in: postIds }, isActive: true },
      select: { postId: true },
    });
    likedSet = new Set(likes.map((l) => l.postId));
  }

  const result: Record<string, { isLiked: boolean; likeCount: number }> = {};
  for (const post of posts) {
    result[post.id] = { isLiked: likedSet.has(post.id), likeCount: post.likes };
  }
  return result;
}

/** Lấy bài viết theo sidebar: "Danh sách về X" + từng topic con (topics phân trang) */
async function listTopicPosts(
  topicSlug: string,
  page = 1,
  limit = 12,
  sidebarId?: string,
  topicsPage = 1,
  topicsLimit = 10,
) {
  const sidebarItem = sidebarId
    ? await prisma.sidebarItem.findUnique({
        where: { id: sidebarId },
        select: {
          name: true,
          slug: true,
          description: true,
          topics: { select: { id: true, name: true, description: true } },
          children: {
            select: {
              topics: { select: { id: true, name: true, description: true } },
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
          topics: { select: { id: true, name: true, description: true } },
          children: {
            select: {
              topics: { select: { id: true, name: true, description: true } },
            },
          },
        },
      });

  const slugActual = sidebarItem?.slug ?? topicSlug;

  if (!sidebarItem) {
    return {
      sidebar: { name: slugActual, description: "", slug: slugActual },
      allPosts: { data: [] as ReturnType<typeof serializePost>[], meta: { page, limit, total: 0, totalPages: 0 } },
      topics: [] as { id: string; name: string; description: string; posts: ReturnType<typeof serializePost>[] }[],
      topicPostCount: 0,
      totalTopics: 0,
      totalTopicsPages: 0,
    };
  }

  // Gom tất cả topic ids (parent + children)
  const allTopicIds: string[] = [];
  const topicInfoMap = new Map<string, { id: string; name: string; description: string | null }>();
  for (const t of sidebarItem.topics) {
    allTopicIds.push(t.id);
    topicInfoMap.set(t.id, t);
  }
  for (const child of sidebarItem.children) {
    for (const t of child.topics) {
      allTopicIds.push(t.id);
      topicInfoMap.set(t.id, t);
    }
  }

  if (allTopicIds.length === 0) {
    return {
      sidebar: { name: sidebarItem.name, description: sidebarItem.description ?? "", slug: slugActual },
      allPosts: { data: [], meta: { page, limit, total: 0, totalPages: 0 } },
      topics: [],
      topicPostCount: 0,
      totalTopics: 0,
      totalTopicsPages: 0,
    };
  }

  // "Danh sách về X" — tất cả bài viết phân trang
  const skip = (page - 1) * limit;
  const [allPublishedPosts, totalPosts] = await Promise.all([
    prisma.post.findMany({
      where: { topics: { some: { id: { in: allTopicIds } } }, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: POST_SELECT,
    }),
    prisma.post.count({
      where: { topics: { some: { id: { in: allTopicIds } } }, status: "PUBLISHED" },
    }),
  ]);

  // Phân trang topics
  const uniqueTopicIds = [...new Set(allTopicIds)];
  const totalTopics = uniqueTopicIds.length;
  const totalTopicsPages = Math.ceil(totalTopics / topicsLimit);
  const topicsSkip = (topicsPage - 1) * topicsLimit;
  const pagedTopicIds = uniqueTopicIds.slice(topicsSkip, topicsSkip + topicsLimit);

  // Mỗi topic lấy 14 bài preview
  const PREVIEW_LIMIT = 14;
  const topicPostResults = await Promise.all(
    pagedTopicIds.map((tid) =>
      prisma.post.findMany({
        where: { topics: { some: { id: tid } }, status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: PREVIEW_LIMIT,
        select: POST_SELECT,
      })
    )
  );

  const topics = pagedTopicIds.map((tid, idx) => {
    const info = topicInfoMap.get(tid)!;
    return {
      id: info.id,
      name: info.name,
      description: info.description ?? "",
      posts: topicPostResults[idx]!.map(serializePost),
    };
  });

  return {
    sidebar: { name: sidebarItem.name, description: sidebarItem.description ?? "", slug: slugActual },
    allPosts: {
      data: allPublishedPosts.map(serializePost),
      meta: { page, limit, total: totalPosts, totalPages: Math.ceil(totalPosts / limit) },
    },
    topics,
    topicPostCount: totalPosts,
    totalTopics,
    totalTopicsPages,
  };
}

/** Lấy bài viết của 1 topic cụ thể — phân trang */
async function listPostsByTopicId(topicId: string, page = 1, limit = 12) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { id: true, name: true, description: true },
  });
  if (!topic) return null;

  const skip = (page - 1) * limit;
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { topics: { some: { id: topicId } }, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: POST_SELECT,
    }),
    prisma.post.count({
      where: { topics: { some: { id: topicId } }, status: "PUBLISHED" },
    }),
  ]);

  return {
    topic,
    data: posts.map(serializePost),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export const postService = {
  createPost,
  listPosts,
  getPostByIdOrSlug,
  updatePost,
  deletePost,
  toggleCounter,
  getLikedPostIds,
  togglePostLike,
  getPostLikeState,
  getBulkLikeStates,
  listTopicPosts,
  listPostsByTopicId,
};
