import { prisma } from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import type { CreateTopicInput, ListTopicsQuery, UpdateTopicInput } from "../validations/topic.validation.js";

async function listTopics(query?: ListTopicsQuery) {
  const page = query?.page ?? 1;
  const limit = query?.limit ?? 20;
  const where = query?.q
    ? { name: { contains: query.q, mode: "insensitive" as const } }
    : {};

  const [topics, total] = await Promise.all([
    prisma.topic.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { posts: true } } },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.topic.count({ where }),
  ]);

  return {
    data: topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      description: topic.description,
      postCount: topic._count.posts,
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function createTopic(input: CreateTopicInput) {
  const topic = await prisma.topic.create({
    data: { name: input.name, description: input.description ?? null },
  });
  return { id: topic.id, name: topic.name, description: topic.description };
}

async function updateTopic(id: string, input: UpdateTopicInput) {
  const existing = await prisma.topic.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw ApiError.notFound("Topic not found");
  }

  const topic = await prisma.topic.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description ?? null } : {}),
    },
  });
  return { id: topic.id, name: topic.name, description: topic.description };
}

async function deleteTopic(id: string): Promise<void> {
  const existing = await prisma.topic.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw ApiError.notFound("Topic not found");
  }

  await prisma.topic.delete({ where: { id } });
}

export const topicService = { listTopics, createTopic, updateTopic, deleteTopic };
