import type { Request, Response } from "express";
import { postService } from "../services/post.service.js";
import { getSectionById } from "../services/section.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import type { ListPostsQuery, ListPostsBySectionQuery } from "../validations/post.validation.js";

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const post = await postService.createPost(req.user.id, req.body);
  res.status(201).json({ success: true, message: "Post created", data: post });
});

export const listPosts = asyncHandler(async (req: Request, res: Response) => {
  const result = await postService.listPosts(req.query as unknown as ListPostsQuery);
  res.json({ success: true, data: result.data, meta: result.meta });
});

export const listPostsBySection = asyncHandler(async (req: Request, res: Response) => {
  const sectionId = String(req.params.sectionId);
  const query = req.query as unknown as ListPostsBySectionQuery;

  const section = await getSectionById(sectionId);

  const result = await postService.listPosts({
    sectionId,
    page: query.page,
    limit: query.limit,
  });

  res.json({
    success: true,
    data: result.data,
    meta: result.meta,
    section,
  });
});

export const getPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await postService.getPostByIdOrSlug(String(req.params.id));
  res.json({ success: true, data: post });
});

export const updatePost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const id = String(req.params.id);
  const post = await postService.updatePost(id, req.user, req.body);
  res.json({ success: true, message: "Post updated", data: post });
});

export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const id = String(req.params.id);
  await postService.deletePost(id, req.user);
  res.json({ success: true, message: "Post deleted" });
});

export const togglePostAction = asyncHandler(async (req: Request, res: Response) => {
  const field = req.params.action === "like" ? "likes" : "bookmarks";
  const result = await postService.toggleCounter(
    String(req.params.id),
    field,
    req.body.active,
    req.commenter?.id
  );
  res.json({
    success: true,
    data: { ...result, active: req.body.active },
  });
});

export const getLikedPostIds = asyncHandler(async (req: Request, res: Response) => {
  if (!req.commenter) {
    res.json({ success: true, data: [] });
    return;
  }
  const postIds = (req.query.postIds as string) ?? "";
  const ids = postIds.split(",").map((s) => s.trim()).filter(Boolean);
  const result = await postService.getLikedPostIds(req.commenter.id, ids);
  res.json({ success: true, data: result });
});
