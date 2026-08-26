import type { Request, Response } from "express";
import { getMonthlyVisits } from "../services/stats.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const visitsStats = asyncHandler(async (req: Request, res: Response) => {
  const month = typeof req.query.month === "string" ? req.query.month : undefined;
  const stats = await getMonthlyVisits(month);
  res.json({ success: true, data: stats });
});
