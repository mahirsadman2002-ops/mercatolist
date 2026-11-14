import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimitByKey } from "@/lib/ratelimit";
import { mintMobileSession } from "@/lib/mobile-session";

// Native-app sign-in. NextAuth v5 only speaks browser cookies, so this route
// validates credentials the same way the Credentials provider does and returns
// the session JWT directly. The app sends it back on every request as
// `Cookie: <cookieName>=<token>`, which auth() accepts unchanged — no other
// route needs to know mobile exists.

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
    if (!user || !isValid || user.isBanned) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Same session payload as the other mobile sign-in routes (carries the
    // password fingerprint, so changing the password ends this session too).
    return NextResponse.json({
      success: true,
      data: await mintMobileSession(request, user),
    });
  } catch (error) {
    console.error("[mobile-login] error:", error);
    return NextResponse.json(
      { success: false, error: "Sign-in failed. Please try again." },
      { status: 500 }
    );
  }
}
