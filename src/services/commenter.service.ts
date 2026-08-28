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
