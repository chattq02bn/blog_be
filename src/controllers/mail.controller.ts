import type { Request, Response } from "express";
import { getMailConfig, updateMailConfig } from "../services/mail.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getMailSettings = asyncHandler(async (_req: Request, res: Response) => {
  const config = await getMailConfig();
  res.json({ success: true, data: config });
});

export const updateMailSettings = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const config = await updateMailConfig({ email, password });
  res.json({ success: true, message: "Đã cập nhật cấu hình mail", data: config });
});
