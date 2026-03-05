import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Get client info from a collection, plus all collections for that client
export async function GET(
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

    // Find the collection by ID
    const collection = await prisma.collection.findUnique({
      where: { id },
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

    if (!collection.clientEmail) {
      return NextResponse.json(
        { success: false, error: "This collection has no associated client" },
        { status: 404 }
      );
    }

    // Find all collections for this client email
    const allCollections = await prisma.collection.findMany({
      where: {
        userId: session.user.id,
        clientEmail: collection.clientEmail,
      },
      include: {
        _count: {
          select: { listings: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        clientName: collection.clientName,
        clientEmail: collection.clientEmail,
        clientPhone: collection.clientPhone,
        clientBuyBox: collection.clientBuyBox,
        collections: allCollections.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          listingCount: c._count.listings,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

// PUT: Update client info across all collections with matching clientEmail
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

    // Find the collection to get the client email
    const collection = await prisma.collection.findUnique({
      where: { id },
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

    if (!collection.clientEmail) {
      return NextResponse.json(
        { success: false, error: "This collection has no associated client" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { clientName, clientEmail, clientPhone, clientBuyBox } = body;

    // Validate new email if provided
    if (clientEmail !== undefined) {
      if (!clientEmail || typeof clientEmail !== "string" || !clientEmail.trim()) {
        return NextResponse.json(
          { success: false, error: "Client email cannot be empty" },
          { status: 400 }
        );
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clientEmail.trim())) {
        return NextResponse.json(
          { success: false, error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    // Build the update data (only include fields that were provided)
    const updateData: Record<string, unknown> = {};
    if (clientName !== undefined)
      updateData.clientName = clientName?.trim() || null;
    if (clientEmail !== undefined)
      updateData.clientEmail = clientEmail.trim().toLowerCase();
    if (clientPhone !== undefined)
      updateData.clientPhone = clientPhone?.trim() || null;
    if (clientBuyBox !== undefined) updateData.clientBuyBox = clientBuyBox;

    // Update all collections with the same clientEmail for this user
    await prisma.collection.updateMany({
      where: {
        userId: session.user.id,
        clientEmail: collection.clientEmail,
      },
      data: updateData,
    });

    // Fetch the updated collection for response
    const updated = await prisma.collection.findUnique({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: {
        clientName: updated?.clientName,
        clientEmail: updated?.clientEmail,
        clientPhone: updated?.clientPhone,
        clientBuyBox: updated?.clientBuyBox,
      },
    });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update client" },
      { status: 500 }
    );
  }
}

// DELETE: Remove client info from all matching collections
export async function DELETE(
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

    // Find the collection to get the client email
    const collection = await prisma.collection.findUnique({
      where: { id },
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

    if (!collection.clientEmail) {
      return NextResponse.json(
        { success: false, error: "This collection has no associated client" },
        { status: 404 }
      );
    }

    // Remove client info from all collections with matching email
    await prisma.collection.updateMany({
      where: {
        userId: session.user.id,
        clientEmail: collection.clientEmail,
      },
      data: {
        clientName: null,
        clientEmail: null,
        clientPhone: null,
        clientBuyBox: undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: { removedClientEmail: collection.clientEmail },
    });
  } catch (error) {
    console.error("Error removing client:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove client" },
      { status: 500 }
    );
  }
}
