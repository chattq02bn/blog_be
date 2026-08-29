import { prisma } from "../config/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import ApiError from "../utils/ApiError.js";
import { slugify } from "../utils/slugify.js";
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
  sectionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  author?: { id: number; name: string | null; email: string; avatar?: string | null } | null;
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
  sectionId: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, name: true, email: true, avatar: true } },
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
    sectionId: post.sectionId,
    topicIds: (post.topics ?? []).map((topic) => topic.id),
    tagIds: (post.tags ?? []).map((tag) => tag.id),
    topics: post.topics ?? [],
    tags: post.tags ?? [],
    author,
    authorAvatar: author?.avatar ?? null,
    authorName: author ? (author.name ?? author.email) : "Ẩn danh",
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
  if (query.sectionId !== undefined) {
    where.sectionId = query.sectionId;
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

  const post = await prisma.post.create({
    data: {
      title: input.title,
      slug,
      excerpt: input.excerpt ?? null,
      cover: input.cover ?? null,
      bodyBlocks: input.bodyBlocks as unknown as Prisma.InputJsonValue[],
      status: input.status === "published" ? "PUBLISHED" : "DRAFT",
      sectionId: input.sectionId ?? null,
      authorId,
      ...(input.topicIds.length > 0 ? { topics: { connect: input.topicIds.map((id) => ({ id })) } } : {}),
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
  const existing = await prisma.post.findUnique({ where: { id }, select: { authorId: true } });

  if (!existing) {
    throw ApiError.notFound("Post not found");
  }

  ensureCanManage(existing, requester);

  const data: Record<string, unknown> = {
    ...(input.title !== undefined ? { title: input.title, slug: await uniqueSlug(input.title, id) } : {}),
    ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
    ...(input.cover !== undefined ? { cover: input.cover } : {}),
    ...(input.bodyBlocks !== undefined ? { bodyBlocks: input.bodyBlocks } : {}),
    ...(input.status !== undefined
      ? { status: input.status === "published" ? "PUBLISHED" : "DRAFT" }
      : {}),
    ...(input.sectionId !== undefined ? { sectionId: input.sectionId } : {}),
    ...(input.topicIds !== undefined ? { topics: { set: input.topicIds.map((tid) => ({ id: tid })) } } : {}),
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
    select: { id: true },
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

    const likeCount = await tx.postLike.count({
      where: { postId, isActive: true },
    });

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
};
