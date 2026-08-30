import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
});

export const updateTagSchema = createTagSchema.partial();

export const replaceTagsSchema = z.object({
  tags: z.array(
    z.object({
      id: z.string().trim().min(1).optional(),
      name: z.string().trim().min(1).max(60),
    }),
  ),
});

export const listTagsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().trim().min(1).optional(),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type ReplaceTagsInput = z.infer<typeof replaceTagsSchema>;
export type ListTagsQuery = z.infer<typeof listTagsQuerySchema>;
