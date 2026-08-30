import { prisma } from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import { comparePassword, hashPassword } from "../utils/password.util.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.util.js";
import { sendResetPasswordEmail } from "./mail.service.js";
import type { AuthUser } from "../types/auth.types.js";
import type { LoginInput, RegisterInput } from "../validations/auth.validation.js";

function toAuthUser(user: {
  id: number;
  email: string;
  name: string | null;
  role: AuthUser["role"];
}): AuthUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

async function register(input: RegisterInput): Promise<AuthUser> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });

  if (existing) {
    throw ApiError.conflict("Email is already registered");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, name: input.name },
  });

  return toAuthUser(user);
}

async function issueTokens(user: AuthUser): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  const refreshToken = signRefreshToken({ sub: user.id, email: user.email });
  return { accessToken, refreshToken };
}

async function login(
  input: LoginInput,
): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const passwordMatches = await comparePassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const authUser = toAuthUser(user);
  const tokens = await issueTokens(authUser);

  return { user: authUser, ...tokens };
}

async function refresh(refreshToken: string): Promise<{
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}> {
  let payload: { sub: number; email: string };

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });

  if (!user) {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const authUser = toAuthUser(user);
  const tokens = await issueTokens(authUser);

  return { user: authUser, ...tokens };
}

async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw ApiError.notFound("Email không tồn tại trong hệ thống");
  }

  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let newPassword = "";
  for (let i = 0; i < 10; i++) {
    newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  const name = user.name || user.email;
  await sendResetPasswordEmail(user.email, name, newPassword);
}

export const authService = { register, login, refresh, forgotPassword, toAuthUser };
