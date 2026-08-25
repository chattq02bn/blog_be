import type { NextFunction, Request, RequestHandler, Response } from "express";
import ApiError from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/jwt.util.js";
import type { UserRole } from "../types/auth.types.js";

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    next(ApiError.unauthorized("Missing or malformed Authorization header"));
    return;
  }

  try {
    const payload = verifyAccessToken(header.slice(7).trim());
    req.user = { id: payload.sub, email: payload.email, name: payload.name, role: payload.role };
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired access token"));
  }
};

export const authorize =
  (...roles: UserRole[]): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      next(ApiError.forbidden("You do not have permission to perform this action"));
      return;
    }

    next();
  };
