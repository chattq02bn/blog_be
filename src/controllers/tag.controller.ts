import type { Request, Response } from "express";
import { tagService } from "../services/tag.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import type { ListTagsQuery } from "../validations/tag.validation.js";

export const listTags = asyncHandler(async (req: Request, res: Response) => {
  const result = await tagService.listTags(req.query as unknown as ListTagsQuery);
  res.json({ success: true, data: result.data, meta: result.meta });
});

export const createTag = asyncHandler(async (req: Request, res: Response) => {
  const tag = await tagService.createTag(req.body);
  res.status(201).json({ success: true, message: "Tag created", data: tag });
});

export const updateTag = asyncHandler(async (req: Request, res: Response) => {
  const tag = await tagService.updateTag(String(req.params.id), req.body);
  res.json({ success: true, message: "Tag updated", data: tag });
});

export const deleteTag = asyncHandler(async (req: Request, res: Response) => {
  await tagService.deleteTag(String(req.params.id));
  res.json({ success: true, message: "Tag deleted" });
});

export const replaceTags = asyncHandler(async (req: Request, res: Response) => {
  const tags = await tagService.replaceTags(req.body);
  res.json({ success: true, message: "Tags replaced", data: tags });
});
