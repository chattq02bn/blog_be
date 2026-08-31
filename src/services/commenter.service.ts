import crypto from "crypto";
import { prisma } from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import type { CreateCommenterInput, UpdateCommenterInput } from "../validations/commenter.validation.js";

function sha256hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function serializeCommenter(commenter: { id: number; nickname: string }) {
  return { id: commenter.id, nickname: commenter.nickname };
}

/**
 * Create a new commenter. Returns { commenter, token }.
 * Token is only returned once — client must store it.
 */
export async function createCommenter(input: CreateCommenterInput) {
  const token = generateToken();
  const tokenHash = sha256hex(token);

  const commenter = await prisma.commenter.create({
    data: {
      nickname: input.nickname,
      tokenHash,
    },
    select: { id: true, nickname: true },
  });

  return { commenter: serializeCommenter(commenter), token };
}

/**
 * Find or create a commenter for a logged-in user.
 * Returns { commenter, token? } - token is only returned for new commenters.
 */
export async function findOrCreateForUser(userId: number, name: string) {
  const existing = await prisma.commenter.findUnique({
    where: { userId },
    select: { id: true, nickname: true },
  });
  if (existing) {
    return { commenter: serializeCommenter(existing), token: null };
  }

  const token = generateToken();
  const tokenHash = sha256hex(token);

  const commenter = await prisma.commenter.create({
    data: {
      nickname: name || "Người dùng",
      tokenHash,
      userId,
    },
    select: { id: true, nickname: true },
  });

  return { commenter: serializeCommenter(commenter), token };
}

/**
 * Find or create a commenter by token hash (for anonymous users with existing token).
 */
export async function findOrCreateByTokenHash(tokenHash: string, nickname: string) {
  const existing = await prisma.commenter.findUnique({
    where: { tokenHash },
    select: { id: true, nickname: true },
  });
  if (existing) {
    return { commenter: serializeCommenter(existing), token: null };
  }

  const token = generateToken();
  const newTokenHash = sha256hex(token);

  const commenter = await prisma.commenter.create({
    data: {
      nickname,
      tokenHash: newTokenHash,
    },
    select: { id: true, nickname: true },
  });

  return { commenter: serializeCommenter(commenter), token };
}

/**
 * Create a new anonymous commenter with a nickname. Returns { commenter, token }.
 */
export async function createAnonymousCommenter(nickname: string) {
  const token = generateToken();
  const tokenHash = sha256hex(token);

  const commenter = await prisma.commenter.create({
    data: {
      nickname,
      tokenHash,
    },
    select: { id: true, nickname: true },
  });

  return { commenter: serializeCommenter(commenter), token };
}

/**
 * Update nickname for an authenticated commenter.
 */
export async function updateCommenterNickname(
  commenterId: number,
  input: UpdateCommenterInput
) {
  const existing = await prisma.commenter.findUnique({
    where: { id: commenterId },
    select: { id: true },
  });
  if (!existing) throw ApiError.notFound("Commenter not found");

  const updated = await prisma.commenter.update({
    where: { id: commenterId },
    data: { nickname: input.nickname },
    select: { id: true, nickname: true },
  });

  return serializeCommenter(updated);
}
