import type { Request, Response } from "express";
import {
  createComment,
  deleteComment,
  listComments,
  listReplies,
  toggleReaction,
  updateComment,
} from "../services/comment.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import type { Viewer } from "../services/comment.service.js";
import type { ListCommentsQuery } from "../validations/comment.validation.js";

function getViewer(req: Request): Viewer {
  if (!req.user) return null;
  return { id: req.user.id, role: req.user.role };
}

export const listPostComments = asyncHandler(async (req: Request, res: Response) => {
  const result = await listComments(
    String(req.params.id),
    getViewer(req),
    req.query as unknown as ListCommentsQuery
  );
  res.json({ success: true, data: result.data, meta: result.meta });
});

export const listCommentReplies = asyncHandler(async (req: Request, res: Response) => {
  const result = await listReplies(
    String(req.params.id),
    getViewer(req),
    req.query as unknown as ListCommentsQuery
  );
  res.json({ success: true, data: result.data, meta: result.meta });
});

export const postComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await createComment(String(req.params.id), getViewer(req), req.body);
  res.status(201).json({ success: true, message: "Comment created", data: comment });
});

export const patchComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await updateComment(String(req.params.id), getViewer(req), req.body);
  res.json({ success: true, message: "Comment updated", data: comment });
});

export const removeComment = asyncHandler(async (req: Request, res: Response) => {
  await deleteComment(
    String(req.params.id),
    getViewer(req),
    typeof req.body?.authorName === "string" ? req.body.authorName : undefined
  );
  res.json({ success: true, message: "Comment deleted" });
});

export const toggleCommentReaction = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized("Login required to react");
  }

  const result = await toggleReaction(String(req.params.id), { id: req.user.id }, req.body.emoji);
  res.json({ success: true, data: result });
});
