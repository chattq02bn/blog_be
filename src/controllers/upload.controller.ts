import type { Request, Response } from "express";
import {
  getUploadConfig,
  updateUploadConfig,
  handleFileUpload,
} from "../services/upload.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getUploadConfigController = asyncHandler(async (_req: Request, res: Response) => {
  const config = await getUploadConfig();
  res.json({ success: true, data: config });
});

export const updateUploadConfigController = asyncHandler(async (req: Request, res: Response) => {
  const config = await updateUploadConfig(req.body);
  res.json({ success: true, message: "Cập nhật cấu hình upload thành công", data: config });
});

export const uploadFileController = asyncHandler(async (req: Request, res: Response) => {
  const result = await handleFileUpload(req);
  res.status(201).json({ success: true, message: "Upload thành công", data: result });
});
