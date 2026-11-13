import { encode } from "next-auth/jwt";
import type { NextRequest } from "next/server";

// Shared by the native-app auth routes (/api/mobile/auth/*). NextAuth v5 only
// speaks browser cookies, so these routes mint the same session JWT the web
// uses and hand it to the app, which sends it back as
// `Cookie: <cookieName>=<token>` — auth() accepts it unchanged.

export const MOBILE_SESSION_MAX_AGE = 30 * 24 * 60 * 60; // seconds; NextAuth default

// Salt for the short-lived handoff code used by /handoff → /exchange.
export const HANDOFF_SALT = "mercatolist.mobile-handoff";

export function authSecret(): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Missing AUTH_SECRET / NEXTAUTH_SECRET");
  return secret;
}

// The salt must equal the cookie name auth() will read the token under, which
// Auth.js picks by request protocol (HTTPS → __Secure- prefix).
export function sessionCookieName(request: NextRequest): string {
  const proto =
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(":", "");
  return proto.includes("https")
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

interface MobileUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  emailVerified: Date | null;
}

export async function mintMobileSession(request: NextRequest, user: MobileUser) {
  const cookieName = sessionCookieName(request);

  // Avatar data: URLs are stripped for the same reason as the jwt callback:
  // the token must stay small enough to travel as a header.
  const picture =
    user.avatarUrl && !user.avatarUrl.startsWith("data:") ? user.avatarUrl : null;

  const token = await encode({
    token: {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      picture,
      role: user.role,
      isEmailVerified: !!user.emailVerified,
    },
    secret: authSecret(),
    salt: cookieName,
    maxAge: MOBILE_SESSION_MAX_AGE,
  });

  return {
    token,
    cookieName,
    expiresAt: new Date(Date.now() + MOBILE_SESSION_MAX_AGE * 1000).toISOString(),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: picture,
      isEmailVerified: !!user.emailVerified,
    },
  };
}
