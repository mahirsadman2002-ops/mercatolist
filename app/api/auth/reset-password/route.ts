import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { verifyResetToken } from "@/lib/password-reset";

// POST { uid, exp, sig, password } → verifies the reset token and sets the new
// password. The token is bound to the CURRENT password hash, so it's single-use.
export async function POST(request: NextRequest) {
  try {
    const limit = await rateLimit(request, "authEmail");
    if (!limit.success) return rateLimitResponse(limit.retryAfterSec);

    const { uid, exp, sig, password } = await request.json();

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { success: false, error: "Password needs an uppercase letter and a number." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: String(uid || "") },
      select: { id: true, hashedPassword: true },
    });

    const ok =
      user &&
      verifyResetToken(user.id, Number(exp), String(sig || ""), user.hashedPassword);

    if (!ok) {
      return NextResponse.json(
        { success: false, error: "This reset link is invalid or has expired. Request a new one." },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user!.id },
      // Setting emailVerified: a valid reset proves email control.
      data: { hashedPassword: hashed, emailVerified: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[reset-password] error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong." },
      { status: 500 }
    );
  }
}
