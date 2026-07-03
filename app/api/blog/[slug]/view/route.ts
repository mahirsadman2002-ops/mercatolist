import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Unauthenticated view counter — throttle per IP so it can't be inflated.
    // Over-limit is treated as success so the client-side incrementer stays quiet.
    const limit = await rateLimit(request, "view");
    if (!limit.success) {
      return NextResponse.json({ success: true });
    }

    const { slug } = await params;

    await prisma.blogPost.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error incrementing view count:", error);
    return NextResponse.json(
      { success: false, error: "Failed to increment view count" },
      { status: 500 }
    );
  }
}
