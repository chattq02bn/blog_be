import jwt, { type SignOptions } from "jsonwebtoken";
import env from "../config/env.js";
import type { AccessTokenPayload } from "../types/auth.types.js";

export function signAccessToken(
  payload: Omit<AccessTokenPayload, "iat" | "exp">,
): string {
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as unknown as AccessTokenPayload;
}

export function signRefreshToken(payload: { sub: number | string; email: string }): string {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyRefreshToken(token: string): { sub: number; email: string; iat?: number; exp?: number } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as unknown as {
    sub: number;
    email: string;
    iat?: number;
    exp?: number;
  };
}
