import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("[seed] DATABASE_URL is missing");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@blog.dev" },
    update: {},
    create: {
      email: "admin@blog.dev",
      name: "Admin",
      role: "ADMIN",
      passwordHash,
    },
  });

  const author = await prisma.user.upsert({
    where: { email: "author@blog.dev" },
    update: {},
    create: {
      email: "author@blog.dev",
      name: "Author",
      role: "USER",
      passwordHash,
    },
  });

  const posts = [
    {
      title: "Getting started with Express 5",
      content:
        "Express 5 brings async error handling, improved routing and better performance. This post walks you through the basics of building an API with it.",
      published: true,
    },
    {
      title: "Prisma 7 with driver adapters",
      content:
        "Prisma 7 uses driver adapters by default, making the client leaner. Learn how to configure PostgreSQL with the @prisma/adapter-pg package.",
      published: true,
    },
    {
      title: "Draft: structuring a TypeScript backend",
      content: "A draft about layering routes, controllers, services and repositories.",
      published: false,
    },
  ];

  for (const post of posts) {
    await prisma.post.create({
      data: {
        ...post,
        slug: `${post.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`,
        authorId: author.id,
      },
    });
  }

  console.log(`[seed] Created admin: ${admin.email} / Password123!`);
  console.log(`[seed] Created author: ${author.email} / Password123!`);
  console.log(`[seed] Seeded ${posts.length} posts`);
}

main()
  .catch((error) => {
    console.error("[seed] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
