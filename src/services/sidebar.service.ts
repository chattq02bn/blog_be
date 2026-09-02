import { prisma } from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import type { CreateSidebarItemInput, ReplaceSidebarItemsInput } from "../validations/topic.validation.js";

type SidebarNode = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  idx: number;
  topicIds: string[];
  postCount: number;
  children: SidebarNode[];
  /** Số mục con trực tiếp (có cả khi children được lồng đầy đủ) */
  childrenCount?: number;
};

function serializeRow(
  row: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    idx: number;
    parentId?: string | null;
    topics: { id: string; _count?: { posts: number } | null }[];
    _count?: { children: number } | null;
  }
): SidebarNode {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    idx: row.idx,
    topicIds: row.topics.map((topic) => topic.id),
    postCount: row.topics.reduce((sum, topic) => sum + (topic._count?.posts ?? 0), 0),
    children: [],
    /** Số mục con trực tiếp — FE dùng để hiển thị nút mở rộng rồi load phân trang */
    childrenCount: row._count?.children ?? 0,
  };
}

const SIDEBAR_INCLUDE = {
  topics: { select: { id: true, _count: { select: { posts: true } } } },
  _count: { select: { children: true } },
} as const;

function buildTree(
  rootRows: (Parameters<typeof serializeRow>[0] & { parentId: string | null })[],
  childRows: Parameters<typeof serializeRow>[0][]
): SidebarNode[] {
  const nodes = new Map<string, SidebarNode>();
  for (const row of [...rootRows, ...childRows]) {
    nodes.set(row.id, serializeRow(row));
  }

  const roots: SidebarNode[] = [];
  for (const row of rootRows) {
    roots.push(nodes.get(row.id)!);
  }
  for (const row of childRows) {
    const parent = row.parentId ? nodes.get(row.parentId) : undefined;
    if (parent) {
      parent.children.push(nodes.get(row.id)!);
    }
  }

  const sortNodes = (nodes: SidebarNode[]) => {
    nodes.sort((a, b) => a.idx - b.idx || a.name.localeCompare(b.name));
    nodes.forEach((node) => sortNodes(node.children));
  };
  sortNodes(roots);

  return roots;
}

/**
 * Cây sidebar.
 * - Không truyền page/limit: trả TOÀN BỘ cây (mục con lồng đầy đủ) — dùng cho admin & trang chủ đề.
 * - Truyền { page, limit }: phân trang theo mục gốc, mỗi gốc chỉ nhúng tối đa
 *   `childrenLimit` (mặc định 10) mục con đầu tiên — phần còn lại FE lazy load qua
 *   GET /sidebar/:id/children?offset=...&limit=5.
 */
export async function listSidebarItems(query?: {
  page?: number;
  limit?: number;
  childrenLimit?: number;
  q?: string;
}): Promise<{
  roots: SidebarNode[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}> {
  const paginated =
    Number.isFinite(query?.page) &&
    Number.isFinite(query?.limit) &&
    (query!.page as number) > 0 &&
    (query!.limit as number) > 0;
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 0;
  const childrenLimit = Math.min(
    20,
    Math.max(0, query?.childrenLimit ?? 5)
  );

  const qFilter = query?.q
    ? {
      OR: [
        { name: { contains: query.q, mode: "insensitive" as const } },
      ],
    }
    : {};

  const whereRoots = { parentId: null, ...qFilter };

  const [rootRows, total] = await Promise.all([
    prisma.sidebarItem.findMany({
      where: whereRoots,
      orderBy: { idx: "asc" },
      ...(paginated ? { skip: (page - 1) * limit, take: limit } : {}),
      include: SIDEBAR_INCLUDE,
    }),
    prisma.sidebarItem.count({ where: whereRoots }),
  ]);

  let childRows: Parameters<typeof serializeRow>[0][] = [];
  if (!paginated && rootRows.length > 0) {
    /* Chế độ lấy hết: gắn toàn bộ mục con */
    childRows = await prisma.sidebarItem.findMany({
      where: { parentId: { in: rootRows.map((row) => row.id) } },
      orderBy: { idx: "asc" },
      include: SIDEBAR_INCLUDE,
    });
  } else if (paginated && rootRows.length > 0 && childrenLimit > 0) {
    /* Chế độ phân trang: từng mục gốc chỉ lấy childrenLimit mục con đầu tiên */
    for (const root of rootRows) {
      const part = await prisma.sidebarItem.findMany({
        where: { parentId: root.id },
        orderBy: { idx: "asc" },
        take: childrenLimit,
        include: SIDEBAR_INCLUDE,
      });
      childRows.push(...part);
    }
  }

  const roots = buildTree(rootRows, childRows);

  return {
    roots,
    meta: {
      page,
      limit: paginated ? limit : total || 1,
      total,
      totalPages: Math.max(1, Math.ceil(total / (paginated ? limit : total || 1))),
    },
  };
}

/** Mục con của một mục cha — PHÂN TRANG theo offset (hỗ trợ kích thước trang thay đổi) */
export async function listSidebarChildren(
  parentId: string,
  query?: { offset?: number; limit?: number }
): Promise<{
  rows: SidebarNode[];
  meta: { offset: number; limit: number; total: number };
}> {
  const parent = await prisma.sidebarItem.findUnique({
    where: { id: parentId },
    select: { id: true },
  });

  if (!parent) {
    throw ApiError.notFound("Sidebar item not found");
  }

  const offset = Math.max(0, query?.offset ?? 0);
  const limit = Math.min(20, Math.max(1, query?.limit ?? 5));
  const where = { parentId };

  const [rows, total] = await Promise.all([
    prisma.sidebarItem.findMany({
      where,
      orderBy: { idx: "asc" },
      skip: offset,
      take: limit,
      include: SIDEBAR_INCLUDE,
    }),
    prisma.sidebarItem.count({ where }),
  ]);

  return {
    rows: rows.map((row) => serializeRow(row)),
    meta: { offset, limit, total },
  };
}

export async function createSidebarItem(input: CreateSidebarItemInput): Promise<SidebarNode> {
  const parentId = input.parentId ?? null;

  if (parentId) {
    await prisma.$executeRaw`UPDATE sidebar_items SET idx = idx + 1 WHERE "parentId" = ${parentId}`;
  } else {
    await prisma.$executeRaw`UPDATE sidebar_items SET idx = idx + 1 WHERE "parentId" IS NULL`;
  }

  const item = await prisma.sidebarItem.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      idx: 0,
      ...(input.parentId ? { parentId: input.parentId } : {}),
      ...(input.topicIds.length > 0
        ? { topics: { connect: input.topicIds.map((id) => ({ id })) } }
        : {}),
    },
    include: SIDEBAR_INCLUDE,
  });

  return serializeRow(item);
}

export async function updateSidebarTopics(id: string, input: { topicIds?: string[]; addTopicId?: string }): Promise<SidebarNode> {
  const existing = await prisma.sidebarItem.findUnique({
    where: { id },
    select: { id: true, topics: { select: { id: true } } },
  });
  if (!existing) throw ApiError.notFound("Sidebar item not found");

  let finalTopicIds: string[];
  if (input.topicIds) {
    finalTopicIds = input.topicIds;
  } else if (input.addTopicId) {
    const currentIds = existing.topics.map((t) => t.id);
    finalTopicIds = currentIds.includes(input.addTopicId)
      ? currentIds
      : [...currentIds, input.addTopicId];
  } else {
    finalTopicIds = existing.topics.map((t) => t.id);
  }

  const item = await prisma.sidebarItem.update({
    where: { id },
    data: {
      topics: { set: finalTopicIds.map((tid) => ({ id: tid })) },
    },
    include: SIDEBAR_INCLUDE,
  });

  return serializeRow(item);
}

export async function replaceSidebarItems(input: ReplaceSidebarItemsInput): Promise<SidebarNode[]> {
  const seenIds = new Set<string>();
  for (const item of input.items) {
    if (item.id && seenIds.has(item.id)) {
      throw ApiError.badRequest(`Duplicate sidebar item id "${item.id}"`);
    }
    if (item.id) seenIds.add(item.id);
  }

  await prisma.$transaction(async (tx) => {
    await tx.sidebarItem.deleteMany({ where: {} });

    let order = 0;
    for (const item of input.items) {
      const parent = await tx.sidebarItem.create({
        data: {
          ...(item.id ? { id: item.id } : {}),
          name: item.name,
          slug: item.slug,
          description: item.description ?? null,
          idx: item.idx ?? order,
          ...(item.topicIds.length > 0
            ? { topics: { connect: item.topicIds.map((id) => ({ id })) } }
            : {}),
        },
      });
      order += 1;

      let childOrder = 0;
      for (const child of item.children ?? []) {
        await tx.sidebarItem.create({
          data: {
            ...(child.id ? { id: child.id } : {}),
            name: child.name,
            slug: child.slug,
            description: child.description ?? null,
            idx: child.idx ?? childOrder,
            parentId: parent.id,
            ...(child.topicIds.length > 0
              ? { topics: { connect: child.topicIds.map((id) => ({ id })) } }
              : {}),
          },
        });
        childOrder += 1;
      }
    }
  });

  const { roots } = await listSidebarItems();
  return roots;
}
