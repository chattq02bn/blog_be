import type { NextFunction, Request, RequestHandler, Response } from "express";
import crypto from "crypto";
import { prisma } from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";

declare global {
  namespace Express {
    interface Request {
      commenter?: { id: number; nickname: string };
    }
  }
}

function sha256hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/** Verify Bearer COMMENTER_TOKEN → sets req.commenter */
export const authenticateCommenter: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(ApiError.unauthorized("Missing commenter token"));
    return;
  }
  const token = header.slice(7).trim();
  if (!token) {
    next(ApiError.unauthorized("Missing commenter token"));
    return;
  }

  const tokenHash = sha256hex(token);
  const commenter = await prisma.commenter.findUnique({
    where: { tokenHash },
    select: { id: true, nickname: true },
  });
  if (!commenter) {
    next(ApiError.unauthorized("Invalid commenter token"));
    return;
  }

  req.commenter = commenter;
  next();
};

/** Same as above but proceeds as guest if no token */
export const optionalCommenterAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }
  const token = header.slice(7).trim();
  if (!token) {
    next();
    return;
  }

  try {
    const tokenHash = sha256hex(token);
    const commenter = await prisma.commenter.findUnique({
      where: { tokenHash },
      select: { id: true, nickname: true },
    });
    if (commenter) {
      req.commenter = commenter;
    }
  } catch {
    /* proceed without commenter */
  }
  next();
};
