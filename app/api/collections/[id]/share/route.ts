import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// POST: Toggle public sharing and generate share token
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const collection = await prisma.collection.findUnique({
      where: { id },
      select: {
        userId: true,
        shareToken: true,
        isPubliclyShared: true,
      },
    });

    if (!collection) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 }
      );
    }

    if (collection.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Generate shareToken if it doesn't exist
    const shareToken = collection.shareToken || randomUUID();
    const newSharedState = !collection.isPubliclyShared;

    const updated = await prisma.collection.update({
      where: { id },
      data: {
        shareToken,
        isPubliclyShared: newSharedState,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mercatolist.com";
    const shareUrl = `${baseUrl}/collections/shared/${updated.shareToken}`;

    return NextResponse.json({
      success: true,
      data: {
        shareToken: updated.shareToken,
        isPubliclyShared: updated.isPubliclyShared,
        shareUrl: newSharedState ? shareUrl : null,
      },
    });
  } catch (error) {
    console.error("Error toggling collection sharing:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle collection sharing" },
      { status: 500 }
    );
  }
}
