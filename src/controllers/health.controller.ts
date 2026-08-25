import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";

export const healthCheck = asyncHandler(async (_req: Request, res: Response) => {
  let database = "down";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "up";
  } catch {
    database = "down";
  }

  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      database,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});
