import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// The app registers its Expo push token after sign-in (POST) and removes it on
// sign-out (DELETE). A token belongs to whoever signed in on that device last.

const bodySchema = z.object({
  token: z.string().regex(/^Expo(nent)?PushToken\[[^\]]+\]$/),
  platform: z.enum(["ios", "android"]).optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid push token" }, { status: 400 });
  }
  const { token, platform = "ios" } = parsed.data;
  await prisma.deviceToken.upsert({
    where: { token },
    update: { userId: session.user.id, platform },
    create: { token, platform, userId: session.user.id },
  });
  return NextResponse.json({ success: true, data: { registered: true } });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid push token" }, { status: 400 });
  }
  await prisma.deviceToken.deleteMany({
    where: { token: parsed.data.token, userId: session.user.id },
  });
  return NextResponse.json({ success: true, data: { registered: false } });
}
