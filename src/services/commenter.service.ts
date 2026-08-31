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
 * Generate an anonymous name for a post.
 * Uses random suffix to ensure uniqueness across devices.
 */
export async function generateAnonymousName(postIdOrSlug: string): Promise<string> {
  const post = await prisma.post.findFirst({
    where: { OR: [{ id: postIdOrSlug }, { slug: postIdOrSlug }] },
    select: { id: true },
  });
  if (!post) throw ApiError.notFound("Post not found");

  const rows = await prisma.commenter.findMany({
    where: {
      comments: { some: { postId: post.id } },
      userId: null,
    },
    select: { nickname: true },
    distinct: ["nickname"],
  });

  const usedNames = new Set(rows.map((r) => r.nickname));
  const prefix = "Người dùng ";

  // Try random suffix until we find an unused name
  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = Math.random().toString(36).substring(2, 6);
    const name = `${prefix}${suffix}`;
    if (!usedNames.has(name)) return name;
  }

  // Fallback: use timestamp
  return `${prefix}${Date.now().toString(36)}`;
}

/**
 * Check if a nickname is already used by any commenter on a given post.
 */
export async function checkNameUsed(postIdOrSlug: string, name: string): Promise<boolean> {
  const post = await prisma.post.findFirst({
    where: { OR: [{ id: postIdOrSlug }, { slug: postIdOrSlug }] },
    select: { id: true },
  });
  if (!post) throw ApiError.notFound("Post not found");

  const count = await prisma.commenter.count({
    where: {
      nickname: name,
      comments: { some: { postId: post.id } },
    },
  });
  return count > 0;
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
