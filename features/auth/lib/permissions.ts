import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/features/auth/lib/auth";

export const checkPermission = cache(async (requiredPermission?: string) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { authorized: false, error: "Unauthorized", user: null };
  }

  if (!requiredPermission) {
    return { authorized: true, error: null, user: session.user };
  }

  if (!session.user.role) {
    return {
      authorized: false,
      error: "User has no role assigned",
      user: null,
    };
  }

  const permissions: string[] = session.user.permissions ?? [];

  if (permissions.length === 0) {
    return {
      authorized: false,
      error: "Forbidden: User has no permissions assigned",
      user: null,
    };
  }

  const hasPermission = permissions.includes(requiredPermission);

  if (!hasPermission) {
    return {
      authorized: false,
      error: "Forbidden: Insufficient permissions",
      user: null,
    };
  }

  return { authorized: true, error: null, user: session.user };
});
