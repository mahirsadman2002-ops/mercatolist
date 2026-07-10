import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimitByKey } from "@/lib/ratelimit";

// Native-app sign-in. NextAuth v5 only speaks browser cookies, so this route
// validates credentials the same way the Credentials provider does and returns
// the session JWT directly. The app sends it back on every request as
// `Cookie: <cookieName>=<token>`, which auth() accepts unchanged — no other
// route needs to know mobile exists.

const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // seconds; matches NextAuth default

const bodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();

    // Same throttle key as the web Credentials provider, so attackers can't
    // dodge the limit by switching endpoints.
    const rl = await rateLimitByKey("login", `login:${email}`);
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: "Too many sign-in attempts. Please try again later." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const isValid =
      !!user?.hashedPassword &&
      (await bcrypt.compare(parsed.data.password, user.hashedPassword));
    if (!user || !isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // The salt must equal the cookie name auth() will read the token under,
    // which Auth.js picks by request protocol (HTTPS → __Secure- prefix).
    const proto =
      request.headers.get("x-forwarded-proto") ??
      request.nextUrl.protocol.replace(":", "");
    const cookieName = proto.includes("https")
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error("Missing AUTH_SECRET / NEXTAUTH_SECRET");

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
      secret,
      salt: cookieName,
      maxAge: SESSION_MAX_AGE,
    });

    return NextResponse.json({
      success: true,
      data: {
        token,
        cookieName,
        expiresAt: new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString(),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: picture,
          isEmailVerified: !!user.emailVerified,
        },
      },
    });
  } catch (error) {
    console.error("[mobile-login] error:", error);
    return NextResponse.json(
      { success: false, error: "Sign-in failed. Please try again." },
      { status: 500 }
    );
  }
}
