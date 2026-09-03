import type { Request, Response } from "express";
import { postService } from "../services/post.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const listTopicPostsController = asyncHandler(async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const sidebarId = req.query.sidebarId ? String(req.query.sidebarId) : undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
  const topicsPage = Math.max(1, Number(req.query.topicsPage) || 1);
  const topicsLimit = Math.min(50, Math.max(1, Number(req.query.topicsLimit) || 10));
  const result = await postService.listTopicPosts(slug, page, limit, sidebarId, topicsPage, topicsLimit);
  res.json({
    success: true,
    data: result.allPosts.data,
    meta: result.allPosts.meta,
    sidebar: result.sidebar,
    topics: result.topics,
    topicPostCount: result.topicPostCount,
    totalTopics: result.totalTopics,
    totalTopicsPages: result.totalTopicsPages,
  });
});

export const listPostsByTopicIdController = asyncHandler(async (req: Request, res: Response) => {
  const topicId = String(req.params.topicId);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
  const result = await postService.listPostsByTopicId(topicId, page, limit);
  if (!result) {
    res.status(404).json({ success: false, message: "Topic not found" });
    return;
  }
  res.json({
    success: true,
    data: result.data,
    meta: result.meta,
    topic: result.topic,
  });
});
