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
  slug: z.string().trim().min(1).max(255),
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

/* Phân trang cho GET /sidebar — cả hai param đều tùy chọn (không truyền = lấy hết) */
export const sidebarQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  /** Chế độ phân trang: số mục con nhúng kèm mỗi mục gốc (mặc định 10) */
  childrenLimit: z.coerce.number().int().min(0).max(20).optional(),
  /** GET /sidebar/:id/children — lấy từ vị trí offset trở đi */
  offset: z.coerce.number().int().min(0).optional(),
  q: z.string().trim().min(1).optional(),
});

export const listTopicsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().trim().min(1).optional(),
  sidebarId: z.string().trim().min(1).optional(),
});

export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
export type ReplaceSidebarItemsInput = z.infer<typeof replaceSidebarItemsSchema>;
export type SidebarQuery = z.infer<typeof sidebarQuerySchema>;
export type ListTopicsQuery = z.infer<typeof listTopicsQuerySchema>;
export const patchSidebarItemSchema = z.object({
  topicIds: z.array(z.string().trim().min(1)).optional(),
  addTopicId: z.string().trim().min(1).optional(),
});

export type CreateSidebarItemInput = z.infer<typeof createSidebarItemSchema>;

export const createSidebarItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(255),
  description: z.string().trim().max(500).optional(),
  topicIds: z.array(z.string().trim().min(1)).default([]),
  parentId: z.string().trim().min(1).optional(),
});
