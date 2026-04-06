import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Duplicate a collection
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

    // Fetch the original collection with its listings
    const original = await prisma.collection.findUnique({
      where: { id },
      include: {
        collectionListings: {
          select: {
            listingId: true,
          },
        },
      },
    });

    if (!original) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 }
      );
    }

    if (original.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Create the duplicate collection with copied listings
    const duplicate = await prisma.collection.create({
      data: {
        name: `${original.name} (Copy)`,
        description: original.description,
        userId: session.user.id,
        collectionListings: {
          create: original.collectionListings.map((cl) => ({
            listingId: cl.listingId,
            addedBy: session.user.id,
          })),
        },
      },
      include: {
        _count: {
          select: { collectionListings: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: duplicate.id,
          name: duplicate.name,
          description: duplicate.description,
          listingCount: duplicate._count.collectionListings,
          createdAt: duplicate.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error duplicating collection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to duplicate collection" },
      { status: 500 }
    );
  }
}
