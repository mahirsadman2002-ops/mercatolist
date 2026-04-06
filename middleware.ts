import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Lightweight middleware — no Prisma, no bcrypt, no heavy imports.
// Only checks JWT cookie and redirects for protected routes.

const PROTECTED_PREFIXES = [
  "/my-listings",
  "/inquiries",
  "/saved",
  "/collections",
  "/saved-searches",
  "/profile",
  "/public-profile",
  "/clients",
];

async function getSessionToken(req: NextRequest) {
  // Auth.js v5 uses "authjs.session-token" cookie, or "__Secure-authjs.session-token" in production
  const cookie =
    req.cookies.get("__Secure-authjs.session-token") ||
    req.cookies.get("authjs.session-token");
  if (!cookie?.value) return null;

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(cookie.value, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isDashboardRoute = PROTECTED_PREFIXES.some((p) =>
    pathname.startsWith(p)
  );
  const isAdminRoute = pathname.startsWith("/admin");

  // Only decode JWT if the route actually needs protection
  if (!isDashboardRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  const token = await getSessionToken(req);
  const isLoggedIn = !!token;

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/my-listings/:path*",
    "/inquiries/:path*",
    "/saved/:path*",
    "/collections/:path*",
    "/saved-searches/:path*",
    "/profile/:path*",
    "/public-profile/:path*",
    "/clients/:path*",
    "/admin/:path*",
  ],
};
