import type { Request, Response } from "express";
import {
  listSectionsByTopicSlugs,
  listSectionsByTopicSlug,
} from "../services/section.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const listTopicSections = asyncHandler(async (req: Request, res: Response) => {
  const sections = await listSectionsByTopicSlug(String(req.params.slug));
  res.json({ success: true, data: sections });
});

export const listSectionsBySlugs = asyncHandler(async (req: Request, res: Response) => {
  const slugs = String(req.query.slugs ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean)
    .slice(0, 20);
  const sections = await listSectionsByTopicSlugs(slugs);
  res.json({ success: true, data: sections });
});
