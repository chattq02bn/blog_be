import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  email: z.email({ message: "Invalid email address" }).toLowerCase(),
  role: z.enum(["USER", "ADMIN"]).default("ADMIN"),
  avatar: z.string().trim().max(500000).optional(),
  logoName: z.string().trim().max(60).optional(),
  description: z.string().trim().max(2000).optional(),
});

export const updateProfileSchema = profileSchema.partial();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mật khẩu hiện tại là bắt buộc"),
  newPassword: z
    .string()
    .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự")
    .max(72, "Mật khẩu mới tối đa 72 ký tự"),
});

export const visitsQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format")
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
