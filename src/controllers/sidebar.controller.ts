import type { Request, Response } from "express";
import {
  replaceSidebarItems,
  listSidebarChildren,
  listSidebarItems,
} from "../services/sidebar.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import type { SidebarQuery } from "../validations/topic.validation.js";

export const getSidebar = asyncHandler(async (req: Request, res: Response) => {
  const { roots, meta } = await listSidebarItems(
    req.query as unknown as SidebarQuery
  );
  res.json({ success: true, data: roots, meta });
});

export const getSidebarChildren = asyncHandler(async (req: Request, res: Response) => {
  const { rows, meta } = await listSidebarChildren(
    String(req.params.id),
    req.query as unknown as SidebarQuery
  );
  res.json({ success: true, data: rows, meta });
});

export const putSidebar = asyncHandler(async (req: Request, res: Response) => {
  const items = await replaceSidebarItems(req.body);
  res.json({ success: true, message: "Sidebar updated", data: items });
});
