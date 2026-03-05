import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: List all collections for the current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const collections = await prisma.collection.findMany({
      where: { userId: session.user.id },
      include: {
        listings: {
          include: {
            photos: {
              orderBy: { order: "asc" },
              take: 4,
            },
          },
        },
        _count: {
          select: { listings: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Transform to include listing count and first 4 photos at the top level
    const data = collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      clientName: collection.clientName,
      clientEmail: collection.clientEmail,
      clientPhone: collection.clientPhone,
      clientBuyBox: collection.clientBuyBox,
      listingCount: collection._count.listings,
      previewPhotos: collection.listings
        .flatMap((listing) => listing.photos)
        .slice(0, 4)
        .map((photo) => ({ id: photo.id, url: photo.url })),
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}

// POST: Create a new collection
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      clientName,
      clientEmail,
      clientPhone,
      clientBuyBox,
      listingId,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Collection name is required" },
        { status: 400 }
      );
    }

    // If a listingId is provided, verify the listing exists
    if (listingId) {
      const listing = await prisma.businessListing.findUnique({
        where: { id: listingId },
      });
      if (!listing) {
        return NextResponse.json(
          { success: false, error: "Listing not found" },
          { status: 404 }
        );
      }
    }

    const collection = await prisma.collection.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId: session.user.id,
        clientName: clientName?.trim() || null,
        clientEmail: clientEmail?.trim() || null,
        clientPhone: clientPhone?.trim() || null,
        clientBuyBox: clientBuyBox || null,
        ...(listingId && {
          listings: {
            connect: { id: listingId },
          },
        }),
      },
      include: {
        listings: {
          include: {
            photos: {
              orderBy: { order: "asc" },
              take: 4,
            },
          },
        },
        _count: {
          select: { listings: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: collection.id,
          name: collection.name,
          description: collection.description,
          clientName: collection.clientName,
          clientEmail: collection.clientEmail,
          clientPhone: collection.clientPhone,
          clientBuyBox: collection.clientBuyBox,
          listingCount: collection._count.listings,
          listings: collection.listings,
          createdAt: collection.createdAt,
          updatedAt: collection.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create collection" },
      { status: 500 }
    );
  }
}
