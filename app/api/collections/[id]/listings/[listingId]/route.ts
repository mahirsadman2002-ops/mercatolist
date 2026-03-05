import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE: Remove a listing from a collection
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; listingId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, listingId } = await params;

    // Verify collection exists and user owns it
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        listings: {
          select: { id: true },
        },
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

    // Check if the listing is actually in the collection
    const listingInCollection = collection.listings.some(
      (l) => l.id === listingId
    );

    if (!listingInCollection) {
      return NextResponse.json(
        { success: false, error: "Listing is not in this collection" },
        { status: 404 }
      );
    }

    // Remove listing from collection
    await prisma.collection.update({
      where: { id },
      data: {
        listings: {
          disconnect: { id: listingId },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing listing from collection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove listing from collection" },
      { status: 500 }
    );
  }
}
