import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { decode } from "next-auth/jwt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authSecret, HANDOFF_SALT, mintMobileSession } from "@/lib/mobile-session";

// Step 2 of native-app sign-in via the website: trade the handoff code plus
// the PKCE verifier for the same session payload /api/mobile/auth/login returns.

const bodySchema = z.object({
  code: z.string().min(1),
  verifier: z.string().min(43).max(128),
});

const fail = (status = 401) =>
  NextResponse.json(
    { success: false, error: "Sign-in expired. Please try again." },
    { status }
  );

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return fail(400);

    let payload;
    try {
      payload = await decode({
        token: parsed.data.code,
        secret: authSecret(),
        salt: HANDOFF_SALT,
      });
    } catch {
      return fail();
    }
    if (!payload?.sub || payload.purpose !== "mobile-handoff") return fail();

    const expected = createHash("sha256")
      .update(parsed.data.verifier)
      .digest("base64url");
    if (expected !== payload.challenge) return fail();

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.isBanned) return fail();

    return NextResponse.json({
      success: true,
      data: await mintMobileSession(request, user),
    });
  } catch (error) {
    console.error("[mobile-exchange] error:", error);
    return NextResponse.json(
      { success: false, error: "Sign-in failed. Please try again." },
      { status: 500 }
    );
  }
}
