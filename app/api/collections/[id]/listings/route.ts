import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyAddressPrivacy } from "@/lib/address-privacy";

// POST: Add a listing to a collection via CollectionListing
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

    // Verify collection exists and user is owner or collaborator
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
    const { listingId } = body;

    if (!listingId || typeof listingId !== "string") {
      return NextResponse.json(
        { success: false, error: "listingId is required" },
        { status: 400 }
      );
    }

    // Only a publicly-viewable listing (or one you own) can be added — never a
    // guessed DRAFT/OFF_MARKET/ghost UUID. Prevents using "add to collection"
    // as a read primitive for private listing data.
    const listing = await prisma.businessListing.findFirst({
      where: {
        id: listingId,
        OR: [
          { isGhostListing: false, status: { in: ["ACTIVE", "UNDER_CONTRACT", "SOLD"] } },
          { listedById: session.user.id },
        ],
      },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    // Check for duplicates
    const existing = await prisma.collectionListing.findUnique({
      where: {
        collectionId_listingId: {
          collectionId: id,
          listingId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Listing is already in this collection" },
        { status: 409 }
      );
    }

    // Create CollectionListing record
    const collectionListing = await prisma.collectionListing.create({
      data: {
        collectionId: id,
        listingId,
        addedBy: session.user.id,
      },
      include: {
        listing: {
          include: {
            photos: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    // Redact address/coords + internal fields unless the caller owns it.
    const owns = collectionListing.listing.listedById === session.user.id;
    const safeListing = owns
      ? collectionListing.listing
      : applyAddressPrivacy(collectionListing.listing as any);

    return NextResponse.json({
      success: true,
      data: {
        id: collectionListing.id,
        listingId: collectionListing.listingId,
        personalRating: collectionListing.personalRating,
        clientInterested: collectionListing.clientInterested,
        addedAt: collectionListing.addedAt,
        listing: safeListing,
      },
    });
  } catch (error) {
    console.error("Error adding listing to collection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add listing to collection" },
      { status: 500 }
    );
  }
}
