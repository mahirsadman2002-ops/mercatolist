import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// NextAuth v5 / Auth.js cookie name candidates. The chunked variants (.0, .1)
// appear when the session payload is large enough that NextAuth splits it.
const SESSION_COOKIE_PREFIXES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

function hasSessionCookie(request: NextRequest): boolean {
  for (const prefix of SESSION_COOKIE_PREFIXES) {
    if (request.cookies.get(prefix)) return true;
    // Chunked cookies have .0, .1, .2 suffixes
    if (request.cookies.get(`${prefix}.0`)) return true;
  }
  return false;
}

export function middleware(request: NextRequest) {
  // Cheap edge gate: redirect page navigations to /login when no session
  // cookie is present. This is UX only — real authorization is enforced in
  // every API route and server component, which validate the actual session.
  if (hasSessionCookie(request)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/my-listings/:path*",
    "/inquiries/:path*",
    "/saved/:path*",
    "/collections/:path*",
    "/saved-searches/:path*",
    "/clients/:path*",
    "/settings/:path*",
    "/profile",
    "/public-profile/:path*",
    "/admin/:path*",
  ],
};
