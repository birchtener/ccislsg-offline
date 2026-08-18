import { z } from "zod";

export const ProfileSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters long")
      .max(15, "First name must be at most 15 characters long")
      .optional(),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters long")
      .max(15, "Last name must be at most 15 characters long")
      .optional(),
    username: z
      .string()
      .min(5, "Username must be at least 5 characters long")
      .max(15, "Username must be at most 15 characters long")
      .optional(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long")
      .max(20, "Password must be at most 20 characters long")
      .optional()
      .or(z.literal("")),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters long")
      .max(20, "New password must be at most 20 characters long")
      .optional()
      .or(z.literal("")),
    confirmPassword: z
      .string()
      .min(6, "Confirm password must be at least 6 characters long")
      .max(20, "Confirm password must be at most 20 characters long")
      .optional()
      .or(z.literal("")),
    avatarFile: z
      .custom<File | null>(
        (val) => val === null || val instanceof File,
        "Invalid file",
      )
      .optional(),
    removeAvatar: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword && data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }

    if (data.newPassword && !data.password) {
      ctx.addIssue({
        code: "custom",
        message: "Current password is required",
        path: ["password"],
      });
    }

    if (data.avatarFile && data.avatarFile.size > 5 * 1024 * 1024) {
      ctx.addIssue({
        code: "custom",
        message: "Image size must be below 5MB",
        path: ["avatarFile"],
      });
    }
  });

export type ProfileInput = z.infer<typeof ProfileSchema>;
