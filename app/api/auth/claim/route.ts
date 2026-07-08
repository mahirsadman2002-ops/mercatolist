import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyClaimToken } from "@/lib/claim";
import { rateLimit, rateLimitResponse } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  // Same limiter as login — this sets a password.
  const limit = await rateLimit(request, "login");
  if (!limit.success) return rateLimitResponse(limit.retryAfterSec);

  try {
    const { uid, exp, token, password } = await request.json();

    if (!uid || !exp || !token || !verifyClaimToken(String(uid), Number(exp), String(token))) {
      return NextResponse.json(
        { success: false, error: "This claim link is invalid or has expired." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters and include an uppercase letter and a number." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: String(uid) },
      select: { id: true, email: true, isManaged: true, claimedAt: true },
    });

    if (!user || !user.isManaged) {
      return NextResponse.json(
        { success: false, error: "This account can't be claimed." },
        { status: 400 }
      );
    }
    if (user.claimedAt) {
      return NextResponse.json(
        { success: false, error: "This account has already been claimed. Please sign in instead.", code: "ALREADY_CLAIMED" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { hashedPassword, claimedAt: new Date(), emailVerified: new Date() },
    });

    // Return the email so the page can sign the user in immediately.
    return NextResponse.json({ success: true, data: { email: user.email } });
  } catch (error) {
    console.error("Claim error:", error);
    return NextResponse.json({ success: false, error: "Failed to claim account" }, { status: 500 });
  }
}
