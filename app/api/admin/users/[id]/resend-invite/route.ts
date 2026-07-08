import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { sendClaimEmail } from "@/lib/claim";

// POST: admin re-sends the right onboarding email for a user:
//  - managed + unclaimed account  → the "claim your account" invite
//  - unverified (real) account     → a fresh email-verification link
//  - already active                → nothing to do
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.response;

  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isManaged: true,
        claimedAt: true,
        emailVerified: true,
      },
    });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Managed account that hasn't set a password yet → resend the claim invite.
    if (user.isManaged && !user.claimedAt) {
      const sent = await sendClaimEmail(
        { ...user, isManaged: true, claimedAt: null },
        "reminder"
      );
      return NextResponse.json({
        success: sent,
        data: { kind: "claim" },
        error: sent ? undefined : "Couldn't send the claim email.",
      });
    }

    // Real account that hasn't verified their email → resend verification.
    if (!user.emailVerified) {
      await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
      const token = uuidv4();
      await prisma.emailVerificationToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      try {
        const { sendEmail } = await import("@/lib/email");
        const VerifyEmail = (await import("@/emails/verify-email")).default;
        const base = process.env.NEXTAUTH_URL || "https://mercatolist.com";
        await sendEmail({
          to: user.email,
          subject: "Verify your email — MercatoList",
          react: VerifyEmail({ name: user.name, verificationUrl: `${base}/verify-email?token=${token}` }),
        });
      } catch (e) {
        console.error("[admin resend-invite] verification email failed:", e);
        return NextResponse.json(
          { success: false, error: "Couldn't send the verification email." },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, data: { kind: "verification" } });
    }

    // Already verified / claimed.
    return NextResponse.json(
      { success: false, error: "This account is already active — nothing to resend." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[admin resend-invite] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resend" },
      { status: 500 }
    );
  }
}
