import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import {
  APP_ACCESS_COOKIE_NAME,
  createAppAccessToken,
  getAppAccessPassword,
  isAppAccessConfigured,
} from "@/lib/auth/access";

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/icon" ||
    pathname === "/apple-icon" ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/api/calendar")
  );
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const configuredPassword = getAppAccessPassword();
  const expectedAccessToken = isAppAccessConfigured()
    ? await createAppAccessToken(configuredPassword)
    : "";
  const currentAccessToken = request.cookies.get(APP_ACCESS_COOKIE_NAME)?.value ?? "";
  const hasAccess =
    expectedAccessToken.length > 0 && currentAccessToken === expectedAccessToken;

  if (pathname === "/login" && hasAccess) {
    return NextResponse.redirect(new URL("/appointments", request.url));
  }

  if (!isPublicPath(pathname) && !hasAccess) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );

    return NextResponse.redirect(loginUrl);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
