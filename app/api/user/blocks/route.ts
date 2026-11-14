import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/ratelimit";

// GET: the users I have blocked.  POST { userId }: block a user.
// A block stops both people from starting or continuing a conversation with
// each other and hides the blocked person's threads from the blocker's inbox.

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const rows = await prisma.userBlock.findMany({
    where: { blockerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      blocked: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
    },
  });
  return NextResponse.json({
    success: true,
    data: rows.map((r) => ({
      id: r.blocked.id,
      name: r.blocked.displayName || r.blocked.name,
      avatarUrl: r.blocked.avatarUrl,
      blockedAt: r.createdAt,
    })),
  });
}

const bodySchema = z.object({ userId: z.string().uuid() });

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const limit = await rateLimit(request, "write", session.user.id);
    if (!limit.success) return rateLimitResponse(limit.retryAfterSec);

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success || parsed.data.userId === session.user.id) {
      return NextResponse.json({ success: false, error: "Invalid user" }, { status: 400 });
    }
    const target = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: { id: true },
    });
    if (!target) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    await prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: { blockerId: session.user.id, blockedId: target.id },
      },
      update: {},
      create: { blockerId: session.user.id, blockedId: target.id },
    });
    return NextResponse.json({ success: true, data: { blocked: true } }, { status: 201 });
  } catch (error) {
    console.error("Error blocking user:", error);
    return NextResponse.json({ success: false, error: "Failed to block user" }, { status: 500 });
  }
}
