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

    const base = (
      process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://mercatolist.com"
    ).replace(/\/$/, "");

    if (user) {
      try {
        const { sendEmail } = await import("@/lib/email");
        if (user.hashedPassword) {
          // Has a password → send the reset link.
          const { exp, sig } = makeResetToken(user.id, user.hashedPassword);
          const ResetPasswordEmail = (await import("@/emails/reset-password")).default;
          await sendEmail({
            to: user.email,
            subject: "Reset your MercatoList password",
            react: ResetPasswordEmail({ name: user.name, resetUrl: resetUrl(user.id, exp, sig) }),
          });
        } else {
          // OAuth-only (Google) account → no password to reset. Send a helpful
          // "just use Continue with Google" email instead of leaving them
          // waiting for a reset link that will never come.
          const GoogleSigninReminder = (await import("@/emails/google-signin-reminder")).default;
          await sendEmail({
            to: user.email,
            subject: "Use Google to sign in to MercatoList",
            react: GoogleSigninReminder({ name: user.name, loginUrl: `${base}/login` }),
          });
        }
      } catch (e) {
        console.error("[forgot-password] send failed:", e);
      }
    }
    // Response is identical whether or not the account exists (no enumeration).

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[forgot-password] error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong." },
      { status: 500 }
    );
  }
}
