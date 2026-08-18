import { z } from "zod";

export const UserFormSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(20, "Username must be at most 20 characters long")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain alphanumeric characters, underscores, dots, or hyphens."),
  first_name: z.string().min(1, "First name is required").max(50, "First name must be at most 50 characters long"),
  last_name: z.string().min(1, "Last name is required").max(50, "Last name must be at most 50 characters long"),
  role_id: z.string().min(1, "Please select a role"),
});

export type UserFormInput = z.infer<typeof UserFormSchema>;
