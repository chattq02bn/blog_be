import type { Request, Response } from "express";
import {
  listSectionsByTopicSlugs,
  listSectionsByTopicSlug,
  listSectionsByTopicSlugPaginated,
} from "../services/section.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const listTopicSections = asyncHandler(async (req: Request, res: Response) => {
  const sections = await listSectionsByTopicSlug(String(req.params.slug));
  res.json({ success: true, data: sections });
});

export const listTopicSectionsPaginated = asyncHandler(async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 5));
  const result = await listSectionsByTopicSlugPaginated(slug, page, limit);
  res.json({ success: true, data: result.data, meta: result.meta });
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
