"use server";

import { headers } from "next/headers";
import { auth } from "@/features/auth/lib/auth";
import { checkPermission } from "@/features/auth/lib/permissions";
import { db } from "@/lib/prisma";

function generateTempPassword(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#&";
  let password = "";
  
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function CreateUser(data: {
  username: string;
  first_name: string;
  last_name: string;
  role_id: string;
}) {
  const { authorized, error } = await checkPermission("users:create");

  if (!authorized) {
    return { ok: false, error: error || "Unauthorized" };
  }

  const usernameNormalized = data.username.trim().toLowerCase();

  if (!/^[a-zA-Z0-9_.-]+$/.test(usernameNormalized)) {
    return { ok: false, error: "Username can only contain alphanumeric characters, underscores, dots, or hyphens." };
  }

  if (data.first_name.trim() === "" || data.last_name.trim() === "") {
    return { ok: false, error: "First and last names are required." };
  }

  try {
    
    const existing = await db.user.findFirst({
      where: {
        OR: [
          { username: usernameNormalized },
          { email: `${usernameNormalized}@ccislsg.com` },
        ],
      },
    });

    if (existing) {
      return { ok: false, error: "Username already exists." };
    }

    const role = await db.role.findUnique({
      where: { id: data.role_id },
    });

    if (!role) {
      return { ok: false, error: "Selected role does not exist." };
    }

    const plainPassword = generateTempPassword();

    const authCtx = await auth.$context;
    const hashedPassword = await authCtx.password.hash(plainPassword);

    const newUser = await db.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: `${usernameNormalized}@ccislsg.com`,
          emailVerified: true,
          name: `${data.first_name.trim()} ${data.last_name.trim()}`,
          first_name: data.first_name.trim(),
          last_name: data.last_name.trim(),
          username: usernameNormalized,
          displayUsername: data.username.trim(),
          role_id: data.role_id,
        },
      });

      await tx.account.create({
        data: {
          userId: u.id,
          providerId: "credential",
          accountId: u.id,
          password: hashedPassword,
        },
      });

      return u;
    });

    return { ok: true, message: "User created successfully", password: plainPassword };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[CREATE_USER_ERROR]", err);
    }
    return { ok: false, error: "An unexpected error occurred during user creation." };
  }
}

export async function UpdateUser(data: {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  role_id: string;
}) {
  const { authorized, error } = await checkPermission("users:update");

  if (!authorized) {
    return { ok: false, error: error || "Unauthorized" };
  }

  const usernameNormalized = data.username.trim().toLowerCase();

  if (!/^[a-zA-Z0-9_.-]+$/.test(usernameNormalized)) {
    return { ok: false, error: "Username can only contain alphanumeric characters, underscores, dots, or hyphens." };
  }

  if (data.first_name.trim() === "" || data.last_name.trim() === "") {
    return { ok: false, error: "First and last names are required." };
  }

  try {
    
    const existing = await db.user.findFirst({
      where: {
        id: { not: data.id },
        OR: [
          { username: usernameNormalized },
          { email: `${usernameNormalized}@ccislsg.com` },
        ],
      },
    });

    if (existing) {
      return { ok: false, error: "Username is already in use by another account." };
    }

    const role = await db.role.findUnique({
      where: { id: data.role_id },
    });

    if (!role) {
      return { ok: false, error: "Selected role does not exist." };
    }

    await db.user.update({
      where: { id: data.id },
      data: {
        email: `${usernameNormalized}@ccislsg.com`,
        name: `${data.first_name.trim()} ${data.last_name.trim()}`,
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        username: usernameNormalized,
        displayUsername: data.username.trim(),
        role_id: data.role_id,
      },
    });

    return { ok: true, message: "User updated successfully" };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[UPDATE_USER_ERROR]", err);
    }
    return { ok: false, error: "An unexpected error occurred during user update." };
  }
}

export async function DeleteUser(id: string) {
  const { authorized, error, user: currentUser } = await checkPermission("users:delete");

  if (!authorized || !currentUser) {
    return { ok: false, error: error || "Unauthorized" };
  }

  if (currentUser.id === id) {
    return { ok: false, error: "You cannot delete your own account." };
  }

  try {
    
    await db.user.delete({
      where: { id },
    });

    return { ok: true, message: "User deleted successfully" };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[DELETE_USER_ERROR]", err);
    }
    return { ok: false, error: "An unexpected error occurred during user deletion." };
  }
}

export async function ResetPassword(userId: string) {
  const { authorized, error } = await checkPermission("users:update");

  if (!authorized) {
    return { ok: false, error: error || "Unauthorized" };
  }

  try {
    const userExists = await db.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return { ok: false, error: "User not found." };
    }

    const plainPassword = generateTempPassword();

    const authCtx = await auth.$context;
    const hashedPassword = await authCtx.password.hash(plainPassword);

    await db.account.updateMany({
      where: {
        userId,
        providerId: "credential",
      },
      data: {
        password: hashedPassword,
      },
    });

    return { ok: true, message: "Password reset successfully", password: plainPassword };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[RESET_PASSWORD_ERROR]", err);
    }
    return { ok: false, error: "An unexpected error occurred during password reset." };
  }
}
