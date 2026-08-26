import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DB_USER: z.string().min(1, "DB_USER is required").default("postgres"),
  DB_PASSWORD: z.string().min(1, "DB_PASSWORD is required").default("postgres"),
  DB_HOST: z.string().min(1, "DB_HOST is required").default("localhost"),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().min(1, "DB_NAME is required").default("blog_db"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("1d"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters").default("blog-dev-refresh-secret-change-me-0123456789abcdef"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  CORS_ORIGIN: z.string().default("*"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "[env] Invalid environment variables:",
    parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
  );
  process.exit(1);
}

const data = parsed.data;

const databaseUrl = `postgresql://${encodeURIComponent(data.DB_USER)}:${encodeURIComponent(
  data.DB_PASSWORD,
)}@${data.DB_HOST}:${data.DB_PORT}/${data.DB_NAME}?schema=public`;

const env = { ...data, databaseUrl };

export default env;
