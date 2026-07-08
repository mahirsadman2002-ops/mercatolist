import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { makeResetToken, resetUrl } from "@/lib/password-reset";

// POST { email } → sends a password-reset link (if the account has a password).
// Always returns success so it never reveals whether an email is registered.
export async function POST(request: NextRequest) {
  try {
    const limit = await rateLimit(request, "authEmail");
    if (!limit.success) return rateLimitResponse(limit.retryAfterSec);

    const { email } = await request.json();
    const clean = String(email || "").trim().toLowerCase();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: clean },
      select: { id: true, name: true, email: true, hashedPassword: true },
    });

    // Only send when the account actually has a password to reset. (OAuth-only
    // accounts have none — they sign in with Google.) Response is identical
    // either way so existence isn't leaked.
    if (user?.hashedPassword) {
      try {
        const { exp, sig } = makeResetToken(user.id, user.hashedPassword);
        const { sendEmail } = await import("@/lib/email");
        const ResetPasswordEmail = (await import("@/emails/reset-password")).default;
        await sendEmail({
          to: user.email,
          subject: "Reset your MercatoList password",
          react: ResetPasswordEmail({ name: user.name, resetUrl: resetUrl(user.id, exp, sig) }),
        });
      } catch (e) {
        console.error("[forgot-password] send failed:", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[forgot-password] error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong." },
      { status: 500 }
    );
  }
}
