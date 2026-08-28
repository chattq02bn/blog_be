import type { Request, Response } from "express";
import { createCommenter, updateCommenterNickname } from "../services/commenter.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const postCommenter = asyncHandler(async (req, res) => {
  const result = await createCommenter(req.body);
  res.status(201).json({ success: true, message: "Commenter created", data: result });
});

export const patchCommenterMe = asyncHandler(async (req, res) => {
  if (!req.commenter) {
    throw (await import("../utils/ApiError.js")).default.unauthorized();
  }
  const commenter = await updateCommenterNickname(req.commenter.id, req.body);
  res.json({ success: true, message: "Nickname updated", data: commenter });
});
