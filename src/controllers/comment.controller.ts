import type { Request, Response } from "express";
import {
  createComment, deleteComment, listComments, listReplies,
  toggleCommentLike, getCommentLikeState, updateComment,
} from "../services/comment.service.js";
import { findOrCreateForUser, createAnonymousCommenter, generateAnonymousName, checkNameUsed } from "../services/commenter.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import type { ListCommentsQuery } from "../validations/comment.validation.js";

/**
 * Resolve commenterId from either auth user or commenter token.
 * Priority: commenter token > auth user (find/create commenter profile).
 */
async function resolveCommenterId(req: Request): Promise<number> {
  if (req.commenter) return req.commenter.id;
  if (req.user) {
    const result = await findOrCreateForUser(req.user.id, req.user.name || "Người dùng");
    return result.commenter.id;
  }
  throw ApiError.unauthorized("Login or commenter token required");
}

export const listPostComments = asyncHandler(async (req, res) => {
  const viewer = req.user ? { id: req.user.id } : null;
  const result = await listComments(
    String(req.params.id), viewer, req.query as unknown as ListCommentsQuery
  );
  res.json({ success: true, data: result.data, meta: result.meta });
});

export const listCommentReplies = asyncHandler(async (req, res) => {
  const viewer = req.user ? { id: req.user.id } : null;
  const result = await listReplies(
    String(req.params.id), viewer, req.query as unknown as ListCommentsQuery
  );
  res.json({ success: true, data: result.data, meta: result.meta });
});

export const postComment = asyncHandler(async (req, res) => {
  let commenterId: number;
  let commenterToken: string | null = null;

  if (req.user) {
    const result = await findOrCreateForUser(req.user.id, req.user.name || "Người dùng");
    commenterId = result.commenter.id;
    if (result.token) commenterToken = result.token;
  } else if (req.commenter) {
    commenterId = req.commenter.id;
  } else {
    const nickname = (req.body as { nickname?: string })?.nickname;
    if (!nickname) {
      throw ApiError.badRequest("Vui lòng nhập tên để bình luận");
    }
    const result = await createAnonymousCommenter(nickname);
    commenterId = result.commenter.id;
    commenterToken = result.token;
  }

  const comment = await createComment(
    String(req.params.id),
    commenterId,
    req.body
  );

  res.status(201).json({
    success: true,
    message: "Comment created",
    data: comment,
    ...(commenterToken ? { commenterToken } : {}),
  });
});

export const patchComment = asyncHandler(async (req, res) => {
  const commenterId = await resolveCommenterId(req);
  const comment = await updateComment(
    String(req.params.id),
    commenterId,
    req.body
  );
  res.json({ success: true, message: "Comment updated", data: comment });
});

export const removeComment = asyncHandler(async (req, res) => {
  const commenterId = await resolveCommenterId(req);
  await deleteComment(String(req.params.id), commenterId);
  res.json({ success: true, message: "Comment deleted" });
});

export const generateCommenterName = asyncHandler(async (req, res) => {
  const postId = String(req.query.postId ?? "");
  if (!postId) {
    throw ApiError.badRequest("postId is required");
  }
  const name = await generateAnonymousName(postId);
  res.json({ success: true, data: { name } });
});

export const checkCommenterName = asyncHandler(async (req, res) => {
  const postId = String(req.query.postId ?? "");
  const name = String(req.query.name ?? "");
  if (!postId || !name) {
    throw ApiError.badRequest("postId and name are required");
  }
  const used = await checkNameUsed(postId, name);
  res.json({ success: true, data: { used } });
});

export const toggleCommentLikeHandler = asyncHandler(async (req, res) => {
  if (!req.commenter) {
    throw ApiError.unauthorized("Commenter token required");
  }
  const result = await toggleCommentLike(String(req.params.id), req.commenter.id);
  res.json({ success: true, data: result });
});

export const getCommentLikeStateHandler = asyncHandler(async (req, res) => {
  const result = await getCommentLikeState(String(req.params.id), req.commenter?.id);
  res.json({ success: true, data: result });
});
