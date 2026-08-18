"use server";

import { headers } from "next/headers";
import { auth } from "@/features/auth/lib/auth";
import {
  ProfileSchema,
  type ProfileInput,
} from "@/features/profile/schema/profile";
import { db } from "@/lib/prisma";
import { checkPermission } from "@/features/auth/lib/permissions";

export async function updateProfile(
  data: ProfileInput,
  uploadedImageUrl?: string | null,
) {
  const { authorized, error, user } = await checkPermission();

  if (!authorized || !user) {
    return { ok: false, error: error || "Unauthorized" };
  }

  const validation = ProfileSchema.safeParse(data);
  if (!validation.success) {
    return {
      ok: false,
      fieldErrors: validation.error.flatten((issue) => issue.message)
        .fieldErrors,
    };
  }

  const { firstName, lastName, username } = validation.data;

  try {
    const currentUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!currentUser) {
      return { ok: false, error: "User record not found." };
    }

    const finalFirstName = firstName?.trim() || currentUser.first_name;
    const finalLastName = lastName?.trim() || currentUser.last_name;
    const finalUsername = username?.trim() || currentUser.username;
    const usernameNormalized = finalUsername.toLowerCase();

    if (usernameNormalized !== currentUser.username.toLowerCase()) {
      const existing = await db.user.findFirst({
        where: {
          id: { not: user.id },
          OR: [
            { username: usernameNormalized },
            { email: `${usernameNormalized}@ccislsg.com` },
          ],
        },
      });

      if (existing) {
        return { ok: false, error: "Username is already in use by another account." };
      }
    }

    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        first_name: finalFirstName,
        last_name: finalLastName,
        username: usernameNormalized,
        displayUsername: finalUsername,
        email: `${usernameNormalized}@ccislsg.com`,
        name: `${finalFirstName} ${finalLastName}`.trim(),
        ...(uploadedImageUrl !== undefined && { image: uploadedImageUrl }),
      },
    });

    await auth.api.getSession({
      headers: await headers(),
      query: {
        disableCookieCache: true,
      },
    });

    return { ok: true };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[UPDATE_PROFILE_ERROR]", error);
    }
    return { ok: false, error: "Failed to update profile record." };
  }
}
