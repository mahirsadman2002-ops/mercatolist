import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/ratelimit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const rl = await rateLimit(request, "view");
    if (!rl.success) {
      // Silently swallow the over-limit case — view tracking is best-effort
      // and we don't want to surface an error to the page that triggered it.
      return NextResponse.json({ success: true, throttled: true });
    }

    const { id } = await params;

    await prisma.businessListing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("view-count increment failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to increment view" },
      { status: 500 }
    );
  }
}
