import { prisma } from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import { hashPassword, comparePassword } from "../utils/password.util.js";
import { sendWelcomeEmail } from "../services/mail.service.js";
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
} from "../validations/user.validation.js";
import type { UpdateProfileInput, ChangePasswordInput } from "../validations/profile.validation.js";

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  mailStatus: true,
  mailError: true,
  avatar: true,
  logoName: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { posts: true, reactions: true } },
} as const;

function serializeUser(user: {
  id: number;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "INACTIVE";
  mailStatus: "PENDING" | "SENT" | "FAILED";
  mailError: string | null;
  avatar: string | null;
  logoName: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { posts: number; reactions: number };
}) {
  return {
    id: String(user.id),
    email: user.email,
    name: user.name,
    role: user.role === "ADMIN" ? ("admin" as const) : ("user" as const),
    status: user.status === "ACTIVE" ? ("active" as const) : ("inactive" as const),
    mailStatus: user.mailStatus.toLowerCase() as "pending" | "sent" | "failed",
    mailError: user.mailError,
    avatar: user.avatar,
    logoName: user.logoName,
    description: user.description,
    postsCount: user._count?.posts ?? 0,
    reactionsCount: user._count?.reactions ?? 0,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function listUsers(query: ListUsersQuery) {
  const where: Record<string, unknown> = {};

  if (query.role) {
    where.role = query.role;
  }
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" as const } },
      { email: { contains: query.q, mode: "insensitive" as const } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: USER_SELECT,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users.map(serializeUser),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getUserById(id: number) {
  const user = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return serializeUser(user);
}

async function ensureEmailAvailable(email: string, excludeId?: number): Promise<void> {
  const existing = await prisma.user.findFirst({
    where: { email, ...(excludeId !== undefined ? { NOT: { id: excludeId } } : {}) },
    select: { id: true },
  });
  if (existing) {
    throw ApiError.conflict("Email is already in use");
  }
}

export async function createUser(input: CreateUserInput) {
  await ensureEmailAvailable(input.email);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash: await hashPassword(input.password),
      name: input.name,
      role: input.role,
      ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
    },
    select: USER_SELECT,
  });

  const mailSent = await sendWelcomeEmail(input.email, input.name, input.password);
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      mailStatus: mailSent ? "SENT" : "FAILED",
      mailError: mailSent ? null : "Gửi mail thất bại",
    },
    select: USER_SELECT,
  });

  return serializeUser(updatedUser);
}

export async function updateUser(id: number, input: UpdateUserInput) {
  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw ApiError.notFound("User not found");
  }

  if (input.email !== undefined) {
    await ensureEmailAvailable(input.email, id);
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
      ...(input.password !== undefined ? { passwordHash: await hashPassword(input.password) } : {}),
    },
    select: USER_SELECT,
  });

  return serializeUser(user);
}

export async function deleteUser(id: number, requesterId: number): Promise<void> {
  if (id === requesterId) {
    throw ApiError.badRequest("You cannot delete your own account");
  }

  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw ApiError.notFound("User not found");
  }

  await prisma.user.update({ where: { id }, data: { status: "INACTIVE" } });
}

export async function toggleUserStatus(id: number): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id }, select: { status: true } });
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  await prisma.user.update({
    where: { id },
    data: { status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
  });
}

export async function resendWelcomeEmail(id: number): Promise<{ success: boolean; email: string; newPassword?: string; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true },
  });
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const tempPassword = `Note${Math.random().toString(36).slice(2, 10)}!1`;
  const hashedPassword = await hashPassword(tempPassword);

  await prisma.user.update({
    where: { id },
    data: { passwordHash: hashedPassword },
  });

  const sent = await sendWelcomeEmail(user.email, user.name ?? user.email, tempPassword);
  const error = sent ? null : "Gửi mail thất bại";

  await prisma.user.update({
    where: { id },
    data: { mailStatus: sent ? "SENT" : "FAILED", mailError: error },
  });

  return { success: sent, email: user.email, newPassword: sent ? tempPassword : undefined, error: error ?? undefined };
}

export async function getProfile(userId: number) {
  return getUserById(userId);
}

export async function updateProfile(userId: number, input: UpdateProfileInput) {
  // Chỉ cho phép tự cập nhật các trường hồ sơ an toàn
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.avatar !== undefined) data.avatar = input.avatar ?? null;
  if (input.logoName !== undefined) data.logoName = input.logoName ?? null;
  if (input.description !== undefined) data.description = input.description ?? null;

  if (Object.keys(data).length === 0) {
    return getProfile(userId);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: USER_SELECT,
  });

  return serializeUser(user);
}

export async function changePassword(
  userId: number,
  input: ChangePasswordInput,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const valid = await comparePassword(input.currentPassword, user.passwordHash);
  if (!valid) {
    throw ApiError.badRequest("Mật khẩu hiện tại không đúng");
  }

  const newHash = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });
}
