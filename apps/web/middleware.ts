import { type NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "./src/lib/auth/constants";
import { verifySessionToken } from "./src/lib/auth/session-token";

const AUTH_PAGES = new Set(["/auth/signin", "/auth/signup"]);

function buildSignInRedirect(request: NextRequest) {
  const redirectUrl = new URL("/auth/signin", request.url);
  redirectUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(redirectUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionToken ? await verifySessionToken(sessionToken) : null;
  const requiresAuth =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/items") ||
    pathname.startsWith("/theme") ||
    pathname.startsWith("/suggestions") ||
    pathname.startsWith("/eco-discover");

  if (AUTH_PAGES.has(pathname) && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (requiresAuth) {
    if (!session) {
      return buildSignInRedirect(request);
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!session) {
      return buildSignInRedirect(request);
    }
    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard?forbidden=1", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/auth/signin",
    "/auth/signup",
    "/dashboard/:path*",
    "/admin/:path*",
    "/items/:path*",
    "/theme/:path*",
    "/suggestions/:path*",
    "/eco-discover/:path*",
  ],
};
