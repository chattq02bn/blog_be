import type { Request, Response } from "express";
import { createCommenter, updateCommenterNickname, findOrCreateForUser } from "../services/commenter.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const postCommenter = asyncHandler(async (req, res) => {
  const result = await createCommenter(req.body);
  res.status(201).json({ success: true, message: "Commenter created", data: result });
});

/**
 * GET /commenters/me — trả về commenterId của user đã login.
 * Nếu chưa có commenter profile thì tự tạo mới.
 */
export const getCommenterMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw ApiError.unauthorized("Login required");
  }
  const result = await findOrCreateForUser(req.user.id, req.user.name || "Người dùng");
  res.json({ success: true, data: { id: result.commenter.id, nickname: result.commenter.nickname } });
});

export const patchCommenterMe = asyncHandler(async (req, res) => {
  if (!req.commenter) {
    throw ApiError.unauthorized();
  }
  const commenter = await updateCommenterNickname(req.commenter.id, req.body);
  res.json({ success: true, message: "Nickname updated", data: commenter });
});
