import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT: Rate a listing in a collection
export async function PUT(
  request: NextRequest,
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

    // Verify collection access (owner or collaborator)
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        collaborators: {
          select: { userId: true },
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 }
      );
    }

    const isOwner = collection.userId === session.user.id;
    const isCollaborator = collection.collaborators.some(
      (c) => c.userId === session.user.id
    );

    if (!isOwner && !isCollaborator) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { rating } = body;

    if (typeof rating !== "number" || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { success: false, error: "Rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    // Find the CollectionListing
    const collectionListing = await prisma.collectionListing.findUnique({
      where: {
        collectionId_listingId: {
          collectionId: id,
          listingId,
        },
      },
    });

    if (!collectionListing) {
      return NextResponse.json(
        { success: false, error: "Listing is not in this collection" },
        { status: 404 }
      );
    }

    const updated = await prisma.collectionListing.update({
      where: { id: collectionListing.id },
      data: {
        personalRating: rating,
        ratedBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        listingId: updated.listingId,
        personalRating: updated.personalRating,
        ratedBy: updated.ratedBy,
      },
    });
  } catch (error) {
    console.error("Error rating listing:", error);
    return NextResponse.json(
      { success: false, error: "Failed to rate listing" },
      { status: 500 }
    );
  }
}
