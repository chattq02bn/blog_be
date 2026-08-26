import { prisma } from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import type { AuthUser } from "../types/auth.types.js";
import type {
  CreateCommentInput,
  ListCommentsQuery,
  UpdateCommentInput,
} from "../validations/comment.validation.js";

export type Viewer = Pick<AuthUser, "id" | "role"> | null;

type CommentRow = {
  id: string;
  postId: string;
  parentId: string | null;
  authorId: number | null;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  reactions: { emoji: string; userId: number | null }[];
  _count?: { replies: number } | null;
};

function serializeComment(comment: CommentRow, viewer?: { id: number } | null) {
  const counts = new Map<string, number>();
  const myReactions: string[] = [];

  for (const reaction of comment.reactions) {
    counts.set(reaction.emoji, (counts.get(reaction.emoji) ?? 0) + 1);
    if (viewer && reaction.userId === viewer.id) {
      myReactions.push(reaction.emoji);
    }
  }

  return {
    id: comment.id,
    noteId: comment.postId,
    parentId: comment.parentId,
    authorId: comment.authorId,
    author: comment.authorName,
    authorAvatar: comment.authorAvatar,
    content: comment.content,
    isEdited: comment.isEdited,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    reactions: [...counts.entries()].map(([emoji, count]) => ({ emoji, count })),
    myReactions,
    /** Số reply trực tiếp — FE dùng để hiển thị nút "Xem phản hồi" rồi load phân trang */
    repliesCount: comment._count?.replies ?? 0,
  };
}

export type SerializedComment = ReturnType<typeof serializeComment>;

async function resolvePost(idOrSlug: string) {
  const post = await prisma.post.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    select: { id: true },
  });

  if (!post) {
    throw ApiError.notFound("Post not found");
  }

  return post;
}

/** Danh sách bình luận gốc của bài viết — PHÂN TRANG, không kèm reply */
export async function listComments(
  postIdOrSlug: string,
  viewer?: { id: number } | null,
  query?: Partial<ListCommentsQuery>
) {
  const post = await resolvePost(postIdOrSlug);
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 10;
  const where = { postId: post.id, parentId: null };

  const [rows, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        reactions: { select: { emoji: true, userId: true } },
        _count: { select: { replies: true } },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return {
    data: rows.map((row) => serializeComment(row, viewer)),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/** Reply trực tiếp của một comment — cũng phân trang */
export async function listReplies(
  commentId: string,
  viewer?: { id: number } | null,
  query?: Partial<ListCommentsQuery>
) {
  const parent = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });

  if (!parent) {
    throw ApiError.notFound("Comment not found");
  }

  const page = query?.page ?? 1;
  const limit = query?.limit ?? 5;
  const where = { parentId: commentId };

  const [rows, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        reactions: { select: { emoji: true, userId: true } },
        _count: { select: { replies: true } },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return {
    data: rows.map((row) => serializeComment(row, viewer)),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function createComment(
  postIdOrSlug: string,
  viewer: Viewer,
  input: CreateCommentInput
): Promise<SerializedComment> {
  const post = await resolvePost(postIdOrSlug);

  let authorName = input.authorName ?? null;
  let authorAvatar = input.authorAvatar ?? null;
  let authorId: number | null = null;

  if (viewer) {
    const user = await prisma.user.findUnique({
      where: { id: viewer.id },
      select: { name: true, email: true, avatar: true },
    });

    if (!user) {
      throw ApiError.unauthorized();
    }

    authorId = viewer.id;
    authorName = user.name ?? user.email;
    authorAvatar = input.authorAvatar ?? user.avatar;
  }

  if (!authorName) {
    throw ApiError.badRequest("Guest comments require authorName");
  }

  if (input.parentId) {
    const parent = await prisma.comment.findFirst({
      where: { id: input.parentId, postId: post.id },
      select: { id: true },
    });
    if (!parent) {
      throw ApiError.badRequest("Parent comment not found for this post");
    }
  }

  const created = await prisma.comment.create({
    data: {
      postId: post.id,
      parentId: input.parentId ?? null,
      authorId,
      authorName,
      authorAvatar,
      content: input.content,
    },
    include: { reactions: { select: { emoji: true, userId: true } } },
  });

  return serializeComment(created, viewer ? { id: viewer.id } : null);
}

function ensureCanManage(
  comment: { authorId: number | null; authorName: string },
  viewer: Viewer,
  authorNameHint?: string
): void {
  if (!viewer) {
    // Khách chỉ sửa/xóa được bình luận của chính mình khi khớp đúng tên đã dùng
    if (
      comment.authorId === null &&
      authorNameHint !== undefined &&
      authorNameHint === comment.authorName
    ) {
      return;
    }
    throw ApiError.unauthorized("You are not allowed to modify this comment");
  }

  if (comment.authorId !== viewer.id && viewer.role !== "ADMIN") {
    throw ApiError.forbidden("You are not allowed to modify this comment");
  }
}

export async function updateComment(
  commentId: string,
  viewer: Viewer,
  input: UpdateCommentInput
): Promise<SerializedComment> {
  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { reactions: { select: { emoji: true, userId: true } } },
  });

  if (!existing) {
    throw ApiError.notFound("Comment not found");
  }

  ensureCanManage(existing, viewer, input.authorName);

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: {
      content: input.content,
      isEdited: true,
    },
    include: { reactions: { select: { emoji: true, userId: true } } },
  });

  return serializeComment(updated, viewer ? { id: viewer.id } : null);
}

export async function deleteComment(
  commentId: string,
  viewer: Viewer,
  authorNameHint?: string
): Promise<void> {
  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, authorId: true, authorName: true },
  });

  if (!existing) {
    throw ApiError.notFound("Comment not found");
  }

  ensureCanManage(existing, viewer, authorNameHint);
  await prisma.comment.delete({ where: { id: commentId } });
}

export async function toggleReaction(
  commentId: string,
  viewer: { id: number },
  emoji: string
): Promise<{ comment: SerializedComment; active: boolean }> {
  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });

  if (!existing) {
    throw ApiError.notFound("Comment not found");
  }

  const reactionWhere = {
    commentId_userId_emoji: { commentId, userId: viewer.id, emoji },
  } as const;

  const reacted = await prisma.commentReaction.findUnique({
    where: reactionWhere,
    select: { id: true },
  });

  let active: boolean;
  if (reacted) {
    await prisma.commentReaction.delete({ where: reactionWhere });
    active = false;
  } else {
    await prisma.commentReaction.create({
      data: { commentId, userId: viewer.id, emoji },
    });
    active = true;
  }

  const updated = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { reactions: { select: { emoji: true, userId: true } } },
  });

  if (!updated) {
    throw ApiError.notFound("Comment not found");
  }

  return {
    comment: serializeComment(updated, { id: viewer.id }),
    active,
  };
}
