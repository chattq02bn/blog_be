import { z } from "zod";

export const COMMENT_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡", "👏", "🙏"] as const;

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, "Content is required").max(2000),
  parentId: z.string().trim().min(1).nullable().optional(),
  authorName: z.string().trim().min(1).max(80).optional(),
  authorAvatar: z.string().trim().max(500000).optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().trim().min(1, "Content is required").max(2000),
  authorName: z.string().trim().min(1).max(80).optional(),
});

export const reactionBodySchema = z.object({
  emoji: z.enum(COMMENT_EMOJIS),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
