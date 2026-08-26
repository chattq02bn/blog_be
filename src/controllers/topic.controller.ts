import type { Request, Response } from "express";
import { topicService } from "../services/topic.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const listTopics = asyncHandler(async (_req: Request, res: Response) => {
  const topics = await topicService.listTopics();
  res.json({ success: true, data: topics });
});

export const createTopic = asyncHandler(async (req: Request, res: Response) => {
  const topic = await topicService.createTopic(req.body);
  res.status(201).json({ success: true, message: "Topic created", data: topic });
});

export const updateTopic = asyncHandler(async (req: Request, res: Response) => {
  const topic = await topicService.updateTopic(String(req.params.id), req.body);
  res.json({ success: true, message: "Topic updated", data: topic });
});

export const deleteTopic = asyncHandler(async (req: Request, res: Response) => {
  await topicService.deleteTopic(String(req.params.id));
  res.json({ success: true, message: "Topic deleted" });
});
