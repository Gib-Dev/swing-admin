import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const authPaths = ["/login"];

function isAuthPath(pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(en|fr)/, "") || "/";
  return authPaths.some(
    (path) => pathWithoutLocale === path || pathWithoutLocale.startsWith(`${path}/`)
  );
}

function isAdminPath(pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(en|fr)/, "") || "/";
  const adminPaths = ["/dashboard", "/tournaments", "/teams", "/sponsorships", "/users", "/settings"];
  return adminPaths.some(
    (path) => pathWithoutLocale === path || pathWithoutLocale.startsWith(`${path}/`)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes except for specific handlers
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Apply i18n middleware
  const response = intlMiddleware(request);

  // Check auth for admin paths
  if (isAdminPath(pathname)) {
    const sessionToken =
      request.cookies.get("authjs.session-token")?.value ??
      request.cookies.get("__Secure-authjs.session-token")?.value;

    if (!sessionToken) {
      const locale = pathname.match(/^\/(en|fr)/)?.[1] ?? "en";
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from login
  if (isAuthPath(pathname)) {
    const sessionToken =
      request.cookies.get("authjs.session-token")?.value ??
      request.cookies.get("__Secure-authjs.session-token")?.value;

    if (sessionToken) {
      const locale = pathname.match(/^\/(en|fr)/)?.[1] ?? "en";
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
