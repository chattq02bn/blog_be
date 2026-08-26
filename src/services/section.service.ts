import { prisma } from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import { POST_SELECT, serializePost } from "./post.service.js";

const SECTION_SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  idx: true,
  topicSlug: true,
  posts: {
    where: { status: "PUBLISHED" },
    select: POST_SELECT,
    orderBy: { createdAt: "desc" },
  },
} as const;

function serializeSection(section: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  idx: number;
  topicSlug: string;
  posts: Parameters<typeof serializePost>[0][];
}) {
  return {
    id: section.id,
    slug: section.slug,
    title: section.title,
    description: section.description ?? "",
    idx: section.idx,
    topicSlug: section.topicSlug,
    posts: section.posts.map(serializePost),
  };
}

export async function listSectionsByTopicSlug(topicSlug: string) {
  const sections = await prisma.section.findMany({
    where: { topicSlug },
    orderBy: { idx: "asc" },
    select: SECTION_SELECT,
  });

  if (sections.length === 0) {
    throw ApiError.notFound("No sections found for this topic");
  }

  return sections.map(serializeSection);
}

/** Lấy sections của nhiều topicSlug một lúc (dùng cho trang mục cha gom sections của các mục con) */
export async function listSectionsByTopicSlugs(slugs: string[]) {
  const sections = await prisma.section.findMany({
    where: { topicSlug: { in: slugs } },
    orderBy: [{ topicSlug: "asc" }, { idx: "asc" }],
    select: SECTION_SELECT,
  });

  const order = new Map(slugs.map((slug, index) => [slug, index]));
  return sections
    .sort(
      (a, b) =>
        (order.get(a.topicSlug) ?? Number.MAX_SAFE_INTEGER) -
          (order.get(b.topicSlug) ?? Number.MAX_SAFE_INTEGER) ||
        a.idx - b.idx
    )
    .map(serializeSection);
}
