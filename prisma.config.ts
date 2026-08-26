import "dotenv/config";
import { defineConfig } from "prisma/config";

function buildDatabaseUrl(): string {
  const user = process.env.DB_USER ?? "postgres";
  const password = process.env.DB_PASSWORD ?? "postgres";
  const host = process.env.DB_HOST ?? "localhost";
  const port = process.env.DB_PORT ?? "5432";
  const name = process.env.DB_NAME ?? "blog_db";

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}?schema=public`;
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
