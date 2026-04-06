import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT: Mark client interest on a listing in a collection
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

    // Verify collection exists and has a client assigned
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!collection) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 }
      );
    }

    // Only the assigned client's linked user can mark interest
    if (!collection.client || !collection.client.advisorId) {
      return NextResponse.json(
        { success: false, error: "No client assigned to this collection" },
        { status: 403 }
      );
    }

    if (collection.client.advisorId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Only the assigned client can mark interest" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { interested } = body;

    if (typeof interested !== "boolean") {
      return NextResponse.json(
        { success: false, error: "interested must be a boolean" },
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
        clientInterested: interested,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        listingId: updated.listingId,
        clientInterested: updated.clientInterested,
      },
    });
  } catch (error) {
    console.error("Error updating client interest:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update client interest" },
      { status: 500 }
    );
  }
}
