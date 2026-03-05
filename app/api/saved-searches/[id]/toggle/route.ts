import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Toggle isActive on/off for a saved search
export async function POST(
  request: NextRequest,
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

    const savedSearch = await prisma.savedSearch.findUnique({
      where: { id },
    });

    if (!savedSearch) {
      return NextResponse.json(
        { success: false, error: "Saved search not found" },
        { status: 404 }
      );
    }

    if (savedSearch.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const updated = await prisma.savedSearch.update({
      where: { id },
      data: { isActive: !savedSearch.isActive },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        isActive: updated.isActive,
      },
    });
  } catch (error) {
    console.error("Error toggling saved search:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle saved search" },
      { status: 500 }
    );
  }
}
