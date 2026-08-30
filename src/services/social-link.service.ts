import { prisma } from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";

const SOCIAL_PLATFORMS = ["youtube", "instagram", "tiktok", "facebook", "x"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export interface SocialLinkInput {
  platform: SocialPlatform;
  url: string;
}

export interface SocialLinkResponse {
  platform: string;
  url: string;
  isActive: boolean;
  idx: number;
}

function validatePlatform(platform: string): SocialPlatform {
  if (!SOCIAL_PLATFORMS.includes(platform as SocialPlatform)) {
    throw ApiError.badRequest(`Platform không hợp lệ: ${platform}`);
  }
  return platform as SocialPlatform;
}

function validateUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    new URL(trimmed);
    return trimmed;
  } catch {
    throw ApiError.badRequest(`URL không hợp lệ: ${trimmed}`);
  }
}

export async function getAllSocialLinks(): Promise<SocialLinkResponse[]> {
  const links = await prisma.socialLink.findMany({
    orderBy: { idx: "asc" },
  });

  return links.map((l) => ({
    platform: l.platform,
    url: l.url,
    isActive: l.isActive,
    idx: l.idx,
  }));
}

export async function getActiveSocialLinks(): Promise<SocialLinkResponse[]> {
  const links = await prisma.socialLink.findMany({
    where: { isActive: true, url: { not: "" } },
    orderBy: { idx: "asc" },
  });

  return links.map((l) => ({
    platform: l.platform,
    url: l.url,
    isActive: l.isActive,
    idx: l.idx,
  }));
}

export async function upsertSocialLinks(
  items: SocialLinkInput[],
): Promise<SocialLinkResponse[]> {
  for (const item of items) {
    const platform = validatePlatform(item.platform);
    const url = validateUrl(item.url);
    await prisma.socialLink.upsert({
      where: { platform },
      create: { platform, url, isActive: true, idx: SOCIAL_PLATFORMS.indexOf(platform) },
      update: { url, isActive: url !== "" },
    });
  }

  return getAllSocialLinks();
}
