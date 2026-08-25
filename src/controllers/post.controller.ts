import type { Request, Response } from "express";
import { postService } from "../services/post.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import type { ListPostsQuery } from "../validations/post.validation.js";

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

export const getPost = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const post = await postService.getPostById(id);
  res.json({ success: true, data: post });
});

export const updatePost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const id = Number(req.params.id);
  const post = await postService.updatePost(id, req.user, req.body);
  res.json({ success: true, message: "Post updated", data: post });
});

export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const id = Number(req.params.id);
  await postService.deletePost(id, req.user);
  res.json({ success: true, message: "Post deleted" });
});
