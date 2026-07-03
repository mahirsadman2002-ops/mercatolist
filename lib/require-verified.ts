import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Gate a high-trust action behind email verification. Reads emailVerified
 * fresh from the DB (authoritative — never trust a possibly-stale token for
 * enforcement). `action` completes the sentence "verify your email before you
 * can ___".
 */
export async function requireVerifiedEmail(userId: string, action: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });

  if (user?.emailVerified) {
    return { verified: true as const };
  }

  return {
    verified: false as const,
    response: NextResponse.json(
      {
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        error: `Please verify your email before you can ${action}. Check your inbox for the verification link — or resend it from the banner at the top of the page.`,
      },
      { status: 403 }
    ),
  };
}
