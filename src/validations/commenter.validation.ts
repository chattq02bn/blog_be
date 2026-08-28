import { z } from "zod";

export const createCommenterSchema = z.object({
  nickname: z.string().trim().min(1, "Nickname is required").max(80),
});

export const updateCommenterSchema = z.object({
  nickname: z.string().trim().min(1, "Nickname is required").max(80),
});

export type CreateCommenterInput = z.infer<typeof createCommenterSchema>;
export type UpdateCommenterInput = z.infer<typeof updateCommenterSchema>;
