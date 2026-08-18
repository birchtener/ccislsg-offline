import { NextRequest, NextResponse } from "next/server";
import { checkPermission } from "./features/auth/lib/permissions";

export async function proxy(request: NextRequest) {
  const { user } = await checkPermission();

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard"], // Specify the routes the middleware applies to
};
