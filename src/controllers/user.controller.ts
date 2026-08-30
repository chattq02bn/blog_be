import type { Request, Response } from "express";
import {
  changePassword,
  createUser,
  deleteUser,
  getProfile,
  getUserById,
  listUsers,
  updateProfile,
  updateUser,
} from "../services/user.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const listAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await listUsers(req.query as never);
  res.json({ success: true, data: result.data, meta: result.meta });
});

export const getSingleUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await getUserById(Number(req.params.id));
  res.json({ success: true, data: user });
});

export const createNewUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await createUser(req.body);
  res.status(201).json({ success: true, message: "User created", data: user });
});

export const patchUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await updateUser(Number(req.params.id), req.body);
  res.json({ success: true, message: "User updated", data: user });
});

export const removeUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  await deleteUser(Number(req.params.id), req.user.id);
  res.json({ success: true, message: "User deleted" });
});

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const profile = await getProfile(req.user.id);
  res.json({ success: true, data: profile });
});

export const patchMyProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const profile = await updateProfile(req.user.id, req.body);
  res.json({ success: true, message: "Profile updated", data: profile });
});

export const changeMyPassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  await changePassword(req.user.id, req.body);
  res.json({ success: true, message: "Đổi mật khẩu thành công" });
});
