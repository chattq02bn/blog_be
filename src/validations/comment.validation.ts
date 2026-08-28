import { z } from "zod";

export const COMMENT_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡", "👏", "🙏"] as const;

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, "Content is required").max(2000),
  parentId: z.string().trim().min(1).nullable().optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().trim().min(1, "Content is required").max(2000),
});

export const reactionBodySchema = z.object({
  emoji: z.enum(COMMENT_EMOJIS),
});

export const listCommentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type ListCommentsQuery = z.infer<typeof listCommentsQuerySchema>;
