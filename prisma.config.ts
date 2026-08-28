import "dotenv/config";
import { defineConfig } from "prisma/config";

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function buildDatabaseUrl(): string {
  const user = requiredEnv("DB_USER");
  const password = requiredEnv("DB_PASSWORD");
  const host = requiredEnv("DB_HOST");
  const port = requiredEnv("DB_PORT");
  const name = requiredEnv("DB_NAME");

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}?schema=public&sslmode=require`;
}

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },

  datasource: {
    url: buildDatabaseUrl(),
  },
});
