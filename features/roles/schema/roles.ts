import { z } from "zod";

export const RoleFormSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters long")
    .max(50, "Role name must be at most 50 characters long"),
  permissionIds: z.array(z.string()),
});

export type RoleFormInput = z.infer<typeof RoleFormSchema>;
