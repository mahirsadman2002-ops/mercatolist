import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Get a single collection with all listings
export async function GET(
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

    if (!collection) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (collection.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({
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
        listings: collection.listings.map((listing) => ({
          id: listing.id,
          slug: listing.slug,
          title: listing.title,
          description: listing.description,
          category: listing.category,
          status: listing.status,
          askingPrice: listing.askingPrice,
          annualRevenue: listing.annualRevenue,
          cashFlowSDE: listing.cashFlowSDE,
          neighborhood: listing.neighborhood,
          borough: listing.borough,
          address: listing.hideAddress ? null : listing.address,
          photos: listing.photos,
          listedBy: listing.listedBy,
          yearEstablished: listing.yearEstablished,
          numberOfEmployees: listing.numberOfEmployees,
          squareFootage: listing.squareFootage,
          createdAt: listing.createdAt,
        })),
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching collection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch collection" },
      { status: 500 }
    );
  }
}

// PUT: Update collection name, description, and client info
export async function PUT(
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

    // Verify ownership
    const existing = await prisma.collection.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, clientName, clientEmail, clientPhone, clientBuyBox } = body;

    // Build update data — only include fields that were provided
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Collection name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (clientName !== undefined) {
      updateData.clientName = clientName?.trim() || null;
    }

    if (clientEmail !== undefined) {
      updateData.clientEmail = clientEmail?.trim() || null;
    }

    if (clientPhone !== undefined) {
      updateData.clientPhone = clientPhone?.trim() || null;
    }

    if (clientBuyBox !== undefined) {
      updateData.clientBuyBox = clientBuyBox || null;
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { listings: true },
        },
      },
    });

    return NextResponse.json({
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
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating collection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update collection" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a collection
export async function DELETE(
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

    // Verify ownership
    const existing = await prisma.collection.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    await prisma.collection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete collection" },
      { status: 500 }
    );
  }
}
