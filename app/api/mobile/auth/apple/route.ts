import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { exchangeAppleCode, verifyAppleIdentityToken } from "@/lib/apple";
import { mintMobileSession } from "@/lib/mobile-session";

// Native-app "Sign in with Apple". The app posts the identity token iOS gave
// it; we verify it with Apple's keys, find or create the account, and return
// the same session payload as /api/mobile/auth/login.

const bodySchema = z.object({
  identityToken: z.string().min(20),
  authorizationCode: z.string().min(1).optional().nullable(),
  // Apple only supplies the name the very first time, and only to the app.
  fullName: z.string().trim().max(120).optional().nullable(),
});

const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status });

export async function POST(request: NextRequest) {
  try {
    const limit = await rateLimit(request, "authEmail");
    if (!limit.success) return rateLimitResponse(limit.retryAfterSec);

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return fail("Invalid sign-in request.", 400);

    let identity;
    try {
      identity = await verifyAppleIdentityToken(parsed.data.identityToken);
    } catch {
      return fail("Apple sign-in could not be verified. Please try again.", 401);
    }

    // 1. Already linked to an account?
    const link = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: { provider: "apple", providerAccountId: identity.sub },
      },
      include: { user: true },
    });
    let user = link?.user ?? null;

    // 2. Otherwise match an existing account by email — only when Apple
    //    vouches for the address.
    if (!user && identity.email && identity.emailVerified) {
      const existing = await prisma.user.findUnique({ where: { email: identity.email } });
      if (existing) {
        // If that account never proved it owns the address, whoever made it
        // may not be this person: drop its password so only the verified
        // owner (via Apple) can get in from now on.
        user = await prisma.user.update({
          where: { id: existing.id },
          data: existing.emailVerified
            ? {}
            : { emailVerified: new Date(), hashedPassword: null },
        });
      }
    }

    // 3. Brand-new user.
    let isNewUser = false;
    if (!user) {
      if (!identity.email) {
        // Apple omits the email on later sign-ins; without a linked account
        // there is nothing to attach this identity to.
        return fail(
          "We couldn't get an email from Apple. In Settings › Apple Account › Sign in with Apple, remove MercatoList and try again.",
          400
        );
      }
      user = await prisma.user.create({
        data: {
          email: identity.email,
          name: parsed.data.fullName || identity.email.split("@")[0] || "New User",
          emailVerified: identity.emailVerified ? new Date() : null,
        },
      });
      isNewUser = true;
    }

    if (user.isBanned) return fail("This account can't sign in.", 403);

    if (!link) {
      const refreshToken = parsed.data.authorizationCode
        ? await exchangeAppleCode(parsed.data.authorizationCode)
        : null;
      await prisma.account.create({
        data: {
          userId: user.id,
          type: "oauth",
          provider: "apple",
          providerAccountId: identity.sub,
          refresh_token: refreshToken,
        },
      });
    }

    if (isNewUser && identity.emailVerified) {
      const { attachPendingInvites } = await import("@/lib/attach-pending-invites");
      await attachPendingInvites(user.id, user.email);
    }

    return NextResponse.json({
      success: true,
      data: { ...(await mintMobileSession(request, user)), isNewUser },
    });
  } catch (error) {
    console.error("[mobile-apple] error:", error);
    return fail("Sign-in failed. Please try again.", 500);
  }
}
