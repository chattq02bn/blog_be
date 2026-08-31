import { prisma } from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import type {
  CreateCommentInput,
  ListCommentsQuery,
  UpdateCommentInput,
} from "../validations/comment.validation.js";

type CommentRow = {
  id: string;
  postId: string;
  parentId: string | null;
  commenterId: number;
  commenter: { id: number; nickname: string; userId: number | null; user: { avatar: string | null } | null };
  content: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  reactions: { emoji: string; userId: number | null }[];
  _count?: { replies: number } | null;
};

function serializeComment(
  comment: CommentRow,
  postAuthorId: number | null,
  viewer?: { id: number } | null,
  parentMap?: Map<string, { commenter: { nickname: string } }>
) {
  const counts = new Map<string, number>();
  const myReactions: string[] = [];

  for (const reaction of comment.reactions) {
    counts.set(reaction.emoji, (counts.get(reaction.emoji) ?? 0) + 1);
    if (viewer && reaction.userId === viewer.id) {
      myReactions.push(reaction.emoji);
    }
  }

  let parentAuthor: string | undefined;
  if (comment.parentId && parentMap) {
    const parentRow = parentMap.get(comment.parentId);
    if (parentRow) {
      parentAuthor = parentRow.commenter.nickname;
    }
  }

  const isAuthor = postAuthorId != null && comment.commenter.userId === postAuthorId;

  return {
    id: comment.id,
    noteId: comment.postId,
    parentId: comment.parentId,
    commenterId: comment.commenterId,
    author: comment.commenter.nickname,
    authorAvatar: comment.commenter.user?.avatar ?? null,
    isAuthor,
    parentAuthor,
    content: comment.content,
    isEdited: comment.isEdited,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    reactions: [...counts.entries()].map(([emoji, count]) => ({ emoji, count })),
    myReactions,
    repliesCount: comment._count?.replies ?? 0,
  };
}

export type SerializedComment = ReturnType<typeof serializeComment>;

async function resolvePost(idOrSlug: string) {
  const post = await prisma.post.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    select: { id: true, authorId: true },
  });
  if (!post) throw ApiError.notFound("Post not found");
  return post;
}

const commentInclude = {
  reactions: { select: { emoji: true, userId: true } },
  commenter: { select: { id: true, nickname: true, userId: true, user: { select: { avatar: true } } } },
  _count: { select: { replies: true } },
} as const;

// --- listComments ---
export async function listComments(
  postIdOrSlug: string,
  viewer?: { id: number } | null,
  query?: Partial<ListCommentsQuery>
) {
  const post = await resolvePost(postIdOrSlug);
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 10;
  const where = { postId: post.id, parentId: null as string | null };

  const [rows, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: commentInclude,
    }),
    prisma.comment.count({ where }),
  ]);

  return {
    data: rows.map((row) => serializeComment(row, post.authorId, viewer)),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

// --- listReplies: BFS all descendants, paginated ---
export async function listReplies(
  commentId: string,
  viewer?: { id: number } | null,
  query?: Partial<ListCommentsQuery>
) {
  const parent = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, postId: true },
  });
  if (!parent) throw ApiError.notFound("Comment not found");

  const post = await prisma.post.findUnique({
    where: { id: parent.postId },
    select: { authorId: true },
  });

  const page = query?.page ?? 1;
  const limit = query?.limit ?? 5;

  const allDescendantIds: string[] = [];
  let frontier = [commentId];
  while (frontier.length > 0) {
    const children = await prisma.comment.findMany({
      where: { parentId: { in: frontier } },
      select: { id: true },
    });
    const childIds = children.map((c) => c.id);
    allDescendantIds.push(...childIds);
    frontier = childIds;
  }

  if (allDescendantIds.length === 0) {
    return { data: [], meta: { page, limit, total: 0, totalPages: 1 } };
  }

  const total = allDescendantIds.length;
  const offset = (page - 1) * limit;
  const pagedIds = allDescendantIds.slice(offset, offset + limit);

  const rows = await prisma.comment.findMany({
    where: { id: { in: pagedIds } },
    orderBy: { createdAt: "asc" },
    include: commentInclude,
  });

  /* Build parent map: id → row (bao gồm cả parent root + non-paged replies) */
  const parentIds = new Set<string>();
  for (const row of rows) {
    if (row.parentId) parentIds.add(row.parentId);
  }
  const parentRows = parentIds.size > 0
    ? await prisma.comment.findMany({
        where: { id: { in: [...parentIds] } },
        select: { id: true, commenter: { select: { nickname: true } } },
      })
    : [];
  const parentMap = new Map(parentRows.map((r) => [r.id, r]));

  return {
    data: rows.map((row) => serializeComment(row, post?.authorId ?? null, viewer, parentMap)),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

// --- createComment: requires commenterId ---
export async function createComment(
  postIdOrSlug: string,
  commenterId: number,
  input: CreateCommentInput
): Promise<SerializedComment> {
  const post = await resolvePost(postIdOrSlug);

  if (input.parentId) {
    const parent = await prisma.comment.findFirst({
      where: { id: input.parentId, postId: post.id },
      select: { id: true },
    });
    if (!parent) throw ApiError.badRequest("Parent comment not found for this post");
  }

  const created = await prisma.comment.create({
    data: {
      postId: post.id,
      parentId: input.parentId ?? null,
      commenterId,
      content: input.content,
    },
    include: commentInclude,
  });

  /* Build parentMap để trả parentAuthor */
  let parentMap: Map<string, { commenter: { nickname: string } }> | undefined;
  if (input.parentId) {
    const parentRow = await prisma.comment.findUnique({
      where: { id: input.parentId },
      select: { id: true, commenter: { select: { nickname: true } } },
    });
    if (parentRow) {
      parentMap = new Map([[parentRow.id, parentRow]]);
    }
  }

  return serializeComment(created, post.authorId, undefined, parentMap);
}

// --- Permission: check commenter owns comment ---
function ensureCanManage(
  comment: { commenterId: number },
  commenterId: number
): void {
  if (comment.commenterId !== commenterId) {
    throw ApiError.forbidden("You are not allowed to modify this comment");
  }
}

// --- updateComment ---
export async function updateComment(
  commentId: string,
  commenterId: number,
  input: UpdateCommentInput
): Promise<SerializedComment> {
  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { reactions: { select: { emoji: true, userId: true } }, commenter: { select: { id: true, nickname: true, userId: true } } },
  });
  if (!existing) throw ApiError.notFound("Comment not found");

  ensureCanManage(existing, commenterId);

  const post = await prisma.post.findUnique({
    where: { id: existing.postId },
    select: { authorId: true },
  });

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content: input.content, isEdited: true },
    include: commentInclude,
  });

  return serializeComment(updated, post?.authorId ?? null);
}

// --- deleteComment ---
export async function deleteComment(
  commentId: string,
  commenterId: number
): Promise<void> {
  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, commenterId: true },
  });
  if (!existing) throw ApiError.notFound("Comment not found");

  ensureCanManage(existing, commenterId);
  await prisma.comment.delete({ where: { id: commentId } });
}

// --- toggleReaction: Auth-only (regular user), toggle on/off ---
export async function toggleReaction(
  commentId: string,
  viewer: { id: number },
  emoji: string
): Promise<{ comment: SerializedComment; active: boolean }> {
  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });
  if (!existing) throw ApiError.notFound("Comment not found");

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
    include: commentInclude,
  });
  if (!updated) throw ApiError.notFound("Comment not found");

  const post = await prisma.post.findUnique({
    where: { id: updated.postId },
    select: { authorId: true },
  });

  return { comment: serializeComment(updated, post?.authorId ?? null, { id: viewer.id }), active };
}
