import type { Request, Response } from "express";
import {
  createComment, deleteComment, listComments, listReplies,
  toggleReaction, updateComment,
} from "../services/comment.service.js";
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
  if (!req.commenter) {
    throw ApiError.unauthorized("Commenter token required");
  }
  const comment = await createComment(
    String(req.params.id),
    req.commenter.id,
    req.body
  );
  res.status(201).json({ success: true, message: "Comment created", data: comment });
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
