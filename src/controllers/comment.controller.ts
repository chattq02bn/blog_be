import type { Request, Response } from "express";
import {
  createComment, deleteComment, listComments, listReplies,
  toggleReaction, updateComment,
} from "../services/comment.service.js";
import { findOrCreateForUser, createAnonymousCommenter } from "../services/commenter.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import type { ListCommentsQuery } from "../validations/comment.validation.js";

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
    // Logged-in user: find or create commenter linked to user
    const result = await findOrCreateForUser(req.user.id, req.user.name || "Người dùng");
    commenterId = result.commenter.id;
    if (result.token) commenterToken = result.token;
  } else if (req.commenter) {
    // Has commenter token
    commenterId = req.commenter.id;
  } else {
    // Anonymous: need nickname in body
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
  if (!req.commenter) {
    throw ApiError.unauthorized("Commenter token required");
  }
  const comment = await updateComment(
    String(req.params.id),
    req.commenter.id,
    req.body
  );
  res.json({ success: true, message: "Comment updated", data: comment });
});

export const removeComment = asyncHandler(async (req, res) => {
  if (!req.commenter) {
    throw ApiError.unauthorized("Commenter token required");
  }
  await deleteComment(String(req.params.id), req.commenter.id);
  res.json({ success: true, message: "Comment deleted" });
});

export const toggleCommentReaction = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw ApiError.unauthorized("Login required to react");
  }
  const result = await toggleReaction(String(req.params.id), { id: req.user.id }, req.body.emoji);
  res.json({ success: true, data: result });
});
