import { prisma } from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import type {
  CreateTagInput,
  ReplaceTagsInput,
  UpdateTagInput,
} from "../validations/tag.validation.js";

function serializeTag(tag: { id: string; name: string }) {
  return { id: tag.id, name: tag.name };
}

async function listTags() {
  const tags = await prisma.tag.findMany({ orderBy: { createdAt: "asc" } });
  return tags.map(serializeTag);
}

async function createTag(input: CreateTagInput) {
  const existing = await prisma.tag.findUnique({ where: { name: input.name } });
  if (existing) {
    return serializeTag(existing);
  }

  const tag = await prisma.tag.create({ data: { name: input.name } });
  return serializeTag(tag);
}

async function updateTag(id: string, input: UpdateTagInput) {
  const existing = await prisma.tag.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Tag not found");
  }
  if (input.name === undefined) {
    return serializeTag(existing);
  }

  const duplicated = await prisma.tag.findFirst({ where: { name: input.name, NOT: { id } } });
  if (duplicated) {
    throw ApiError.conflict("A tag with this name already exists");
  }

  const tag = await prisma.tag.update({ where: { id }, data: { name: input.name } });
  return serializeTag(tag);
}

async function deleteTag(id: string): Promise<void> {
  const existing = await prisma.tag.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw ApiError.notFound("Tag not found");
  }
  await prisma.tag.delete({ where: { id } });
}

async function replaceTags(input: ReplaceTagsInput) {
  const result = await prisma.$transaction(async (tx) => {
    const keepIds = input.tags.filter((tag) => tag.id).map((tag) => tag.id as string);

    const deleteWhere = keepIds.length > 0 ? { id: { notIn: keepIds } } : {};
    await tx.tag.deleteMany({ where: deleteWhere });

    const upserted = [];
    for (const tag of input.tags) {
      const saved = tag.id
        ? await tx.tag.upsert({
            where: { id: tag.id },
            update: { name: tag.name },
            create: { id: tag.id, name: tag.name },
          })
        : await tx.tag.upsert({
            where: { name: tag.name },
            update: {},
            create: { name: tag.name },
          });
      upserted.push(saved);
    }

    return upserted;
  });

  return result.map(serializeTag);
}

export const tagService = { listTags, createTag, updateTag, deleteTag, replaceTags };
