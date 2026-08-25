import type { Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import type { AuthUser, UserRole } from "../types/auth.types.js";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.register(req.body);
  res.status(201).json({ success: true, message: "Registered successfully", data: user });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  res.json({
    success: true,
    message: "Logged in successfully",
    data: { user, accessToken, refreshToken },
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.refresh(req.body.refreshToken as string);
  res.json({ success: true, data: result });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const payload: AuthUser = {
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role as UserRole,
  };

  res.json({ success: true, data: payload });
});
