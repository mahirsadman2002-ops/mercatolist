import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Add a listing to a collection
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

    const body = await request.json();
    const { listingId } = body;

    if (!listingId || typeof listingId !== "string") {
      return NextResponse.json(
        { success: false, error: "listingId is required" },
        { status: 400 }
      );
    }

    // Verify the listing exists
    const listing = await prisma.businessListing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    // Check for duplicates
    const alreadyInCollection = collection.listings.some(
      (l) => l.id === listingId
    );

    if (alreadyInCollection) {
      return NextResponse.json(
        { success: false, error: "Listing is already in this collection" },
        { status: 409 }
      );
    }

    // Add listing to collection
    const updatedCollection = await prisma.collection.update({
      where: { id },
      data: {
        listings: {
          connect: { id: listingId },
        },
      },
      include: {
        listings: {
          include: {
            photos: {
              orderBy: { order: "asc" },
            },
            listedBy: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true,
                phone: true,
                role: true,
                brokerageName: true,
              },
            },
          },
        },
        _count: {
          select: { listings: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedCollection.id,
        name: updatedCollection.name,
        description: updatedCollection.description,
        clientName: updatedCollection.clientName,
        clientEmail: updatedCollection.clientEmail,
        clientPhone: updatedCollection.clientPhone,
        clientBuyBox: updatedCollection.clientBuyBox,
        listingCount: updatedCollection._count.listings,
        listings: updatedCollection.listings.map((l) => ({
          id: l.id,
          slug: l.slug,
          title: l.title,
          description: l.description,
          category: l.category,
          status: l.status,
          askingPrice: l.askingPrice,
          annualRevenue: l.annualRevenue,
          cashFlowSDE: l.cashFlowSDE,
          neighborhood: l.neighborhood,
          borough: l.borough,
          address: l.hideAddress ? null : l.address,
          photos: l.photos,
          listedBy: l.listedBy,
          yearEstablished: l.yearEstablished,
          numberOfEmployees: l.numberOfEmployees,
          squareFootage: l.squareFootage,
          createdAt: l.createdAt,
        })),
        createdAt: updatedCollection.createdAt,
        updatedAt: updatedCollection.updatedAt,
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
