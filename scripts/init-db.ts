import { spawnSync } from "node:child_process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import env from "../src/config/env.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.databaseUrl }),
});

const userCount = await prisma.user.count();
await prisma.$disconnect();

if (userCount > 0) {
  console.log(`[init-db] Database already has ${userCount} user(s), skip seeding.`);
  process.exit(0);
}

console.log("[init-db] Empty database detected, seeding sample data...");

const result = spawnSync("npx", ["tsx", "prisma/seed.ts"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
