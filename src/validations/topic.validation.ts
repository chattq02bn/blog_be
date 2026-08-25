import { z } from "zod";

export const createTopicSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().trim().max(2000).optional(),
});

export const updateTopicSchema = createTopicSchema.partial();

const sidebarTopicRefSchema = z.object({
  id: z.string().trim().min(1),
});

const baseSidebarItemSchema = z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).max(120),
  href: z.string().trim().min(1).max(255),
  description: z.string().trim().max(500).optional(),
  idx: z.number().int().default(0),
  topicIds: z.array(z.string().trim().min(1)).default([]),
});

type SidebarItemInput = z.infer<typeof baseSidebarItemSchema> & {
  children?: SidebarItemInput[];
};

export const sidebarItemSchema: z.ZodType<SidebarItemInput> = baseSidebarItemSchema.extend({
  children: z.lazy(() => z.array(sidebarItemSchema)).optional(),
}) as unknown as z.ZodType<SidebarItemInput>;

export const replaceSidebarItemsSchema = z.object({
  items: z.array(sidebarItemSchema),
});

export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
export type ReplaceSidebarItemsInput = z.infer<typeof replaceSidebarItemsSchema>;
