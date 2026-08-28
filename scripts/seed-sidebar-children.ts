import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../src/generated/prisma/client.js";
import env from "../src/config/env.js";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.databaseUrl }) });

const PARENT_SLUG = "xu-huong";
const CHILDREN_TO_ADD = 200;

type Block = { type: string; content?: unknown; props?: Record<string, unknown> };

function paragraph(content: string): Block {
  return { type: "paragraph", content };
}

function heading(content: string): Block {
  return { type: "heading", content, props: { level: 2 } };
}

function bullet(content: string): Block {
  return { type: "bulletListItem", content };
}

function image(seed: string, caption: string): Block {
  return {
    type: "image",
    props: { url: `https://picsum.photos/seed/${seed}/900/480`, caption },
  };
}

function generateBodyBlocks(index: number): Block[] {
  return [
    paragraph(`Bài viết chuyên mục ${index + 1} khám phá các xu hướng mới nhất trong nhiều lĩnh vực.`),
    heading("Xu hướng nổi bật"),
    bullet("Công nghệ và đổi mới sáng tạo"),
    bullet("Phong cách sống tối giản"),
    bullet("Du lịch trải nghiệm"),
    image(`xh-child-${index}-a`, "Xu hướng nổi bật"),
    heading("Phân tích chi tiết"),
    paragraph("Mỗi xu hướng đều có câu chuyện đằng sau, phản ánh nhu cầu và thói quen của con người hiện đại."),
    bullet("Tác động đến đời sống hàng ngày"),
    bullet("Cơ hội phát triển bản thân"),
    heading("Kết luận"),
    paragraph("Theo dõi xu hướng giúp bạn luôn cập nhật và thích nghi với thế giới đang thay đổi mỗi ngày."),
    image(`xh-child-${index}-b`, "Kết quả"),
  ];
}

async function main() {
  const parent = await prisma.sidebarItem.findFirst({
    where: { slug: PARENT_SLUG },
    select: { id: true, name: true },
  });

  if (!parent) {
    console.error(`[seed] Sidebar item "${PARENT_SLUG}" not found!`);
    process.exitCode = 1;
    return;
  }
  console.log(`[seed] Found parent: ${parent.name} (${parent.id})`);

  const existingChildren = await prisma.sidebarItem.count({
    where: { parentId: parent.id },
  });
  console.log(`[seed] Current children: ${existingChildren}`);

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  if (!admin) {
    console.error("[seed] No admin user found!");
    process.exitCode = 1;
    return;
  }

  const tags = await prisma.tag.findMany({ select: { id: true } });
  const tagIds = tags.map((t) => t.id);

  console.log(`[seed] Creating ${CHILDREN_TO_ADD} children with topics and posts...`);

  const startIdx = existingChildren;

  for (let i = 0; i < CHILDREN_TO_ADD; i++) {
    const idx = startIdx + i + 1;
    const name = `Xu hướng • chuyên mục ${String(idx).padStart(2, "0")}`;
    const slug = `xu-huong-chuyen-muc-${idx}`;

    const child = await prisma.sidebarItem.create({
      data: {
        name,
        slug,
        description: `Chuyên mục ${idx} thuộc hệ thống xu hướng`,
        idx,
        parentId: parent.id,
      },
      select: { id: true },
    });

    const topic = await prisma.topic.create({
      data: {
        name,
        description: `Chủ đề chuyên mục ${idx}`,
      },
      select: { id: true },
    });

    await prisma.sidebarItem.update({
      where: { id: child.id },
      data: { topics: { connect: [{ id: topic.id }] } },
    });

    const postsPerChild = 5;
    for (let j = 0; j < postsPerChild; j++) {
      const postIdx = i * postsPerChild + j;
      const title = `${name} — Bài ${j + 1}`;
      const slugBase = `xh-child-${idx}-post-${j + 1}`;

      const daysAgo = 1 + (postIdx % 60);
      const createdDate = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);

      await prisma.post.create({
        data: {
          title,
          slug: `${slugBase}-${Math.random().toString(36).slice(2, 8)}`,
          excerpt: `${title} — bài viết chi tiết.`,
          cover: `https://picsum.photos/seed/seed-xh-${idx}-${j}/1280/670`,
          bodyBlocks: generateBodyBlocks(postIdx) as unknown as Prisma.InputJsonValue[],
          status: "PUBLISHED",
          likes: 10 + ((postIdx * 73) % 500),
          bookmarks: 5 + ((postIdx * 31) % 200),
          authorId: admin.id,
          createdAt: createdDate,
          updatedAt: createdDate,
          topics: { connect: [{ id: topic.id }] },
          tags: tagIds.length
            ? { connect: [{ id: tagIds[postIdx % tagIds.length] }] }
            : undefined,
        },
      });
    }

    if ((i + 1) % 20 === 0) {
      console.log(`[seed] Created ${i + 1}/${CHILDREN_TO_ADD} children...`);
    }
  }

  const finalCount = await prisma.sidebarItem.count({
    where: { parentId: parent.id },
  });
  console.log(`[seed] Done! "${parent.name}" now has ${finalCount} children.`);
}

main()
  .catch((error) => {
    console.error("[seed] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
