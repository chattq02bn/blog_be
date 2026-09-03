import { z } from "zod";

export const postStatusSchema = z.enum(["draft", "published"]);

const blockSchema = z.record(z.string(), z.unknown());

const coerceEmptyToNull = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()
  .optional();

export const createPostSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  excerpt: z.string().trim().max(500).optional(),
  cover: z.string().trim().min(1).max(500000).nullable().optional(),
  bodyBlocks: z.array(blockSchema).default([]),
  status: postStatusSchema.default("draft"),
  sidebarId: coerceEmptyToNull,
  topicIds: z
    .array(z.string().trim())
    .transform((ids) => ids.filter(Boolean))
    .default([]),
  tagIds: z
    .array(z.string().trim())
    .transform((ids) => ids.filter(Boolean))
    .default([]),
});

export const updatePostSchema = createPostSchema.partial();

export const listPostsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(10),
  q: z.string().trim().min(1).optional(),
  status: postStatusSchema.optional(),
  topicId: z.string().trim().min(1).optional(),
  topicIds: z
    .string()
    .trim()
    .min(1)
    .optional()
    .refine((value) => !value || value.split(",").every((id) => id.trim().length > 0), {
      message: "topicIds must be a comma-separated list of ids",
    }),
  tagId: z.string().trim().min(1).optional(),
  sidebarId: coerceEmptyToNull,
  authorId: z.coerce.number().int().positive().optional(),
});

export const idParamSchema = z.object({
  id: z.string().trim().min(1, "Invalid id"),
});

export const reactionParamSchema = z.object({
  id: z.string().trim().min(1),
  action: z.enum(["like", "bookmark"]),
});

export const toggleActionBodySchema = z.object({
  active: z.boolean().default(true),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;
