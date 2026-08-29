import type { NextFunction, Request, RequestHandler, Response } from "express";
import crypto from "crypto";
import { prisma } from "../config/prisma.js";

const COOKIE_NAME = "note_commenter_token";
const COOKIE_MAX_AGE = 180 * 24 * 60 * 60 * 1000;

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

function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) cookies[key] = val;
  }
  return cookies;
}

async function findCommenterByToken(token: string) {
  const tokenHash = sha256hex(token);
  return prisma.commenter.findUnique({
    where: { tokenHash },
    select: { id: true, nickname: true },
  });
}

/**
 * Read commenter from cookie. If not found, proceed as guest.
 * Does NOT auto-create — use ensureCommenter for that.
 */
export const optionalCommenterFromCookie: RequestHandler = async (req, _res, next) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];

  if (token) {
    try {
      const commenter = await findCommenterByToken(token);
      if (commenter) {
        req.commenter = commenter;
      }
    } catch {
      /* proceed without commenter */
    }
  }

  next();
};

/**
 * If req.commenter is already set, skip.
 * Otherwise auto-create a new Commenter, set cookie, and attach to req.
 */
export const ensureCommenter: RequestHandler = async (req, res, next) => {
  if (req.commenter) return next();

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256hex(token);
  const nickname = `User_${crypto.randomBytes(4).toString("hex")}`;

  const commenter = await prisma.commenter.create({
    data: { nickname, tokenHash },
    select: { id: true, nickname: true },
  });

  req.commenter = commenter;

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  next();
};
