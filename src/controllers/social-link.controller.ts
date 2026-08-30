import type { Request, Response } from "express";
import {
  getAllSocialLinks,
  getActiveSocialLinks,
  upsertSocialLinks,
} from "../services/social-link.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const listSocialLinks = asyncHandler(async (_req: Request, res: Response) => {
  const links = await getAllSocialLinks();
  res.json({ success: true, data: links });
});

export const listActiveSocialLinks = asyncHandler(async (_req: Request, res: Response) => {
  const links = await getActiveSocialLinks();
  res.json({ success: true, data: links });
});

export const updateSocialLinks = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { links } = req.body;
  if (!Array.isArray(links)) {
    throw ApiError.badRequest("links phải là mảng");
  }

  const data = await upsertSocialLinks(links);
  res.json({ success: true, message: "Đã cập nhật mạng xã hội", data });
});
