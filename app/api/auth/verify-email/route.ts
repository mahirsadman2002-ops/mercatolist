import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, error: "Invalid verification token" },
        { status: 400 }
      );
    }

    // Check expiry
    if (verificationToken.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({ where: { id: verificationToken.id } });
      return NextResponse.json(
        { success: false, error: "Verification token has expired" },
        { status: 400 }
      );
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: new Date() },
    });

    // Delete used token
    await prisma.emailVerificationToken.delete({ where: { id: verificationToken.id } });

    // Send welcome email
    try {
      const { sendEmail } = await import("@/lib/email");
      const WelcomeEmail = (await import("@/emails/welcome")).default;

      await sendEmail({
        to: verificationToken.user.email,
        subject: "Welcome to MercatoList!",
        react: WelcomeEmail({ name: verificationToken.user.name }),
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
