import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Get a single client with their collections
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

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        collections: {
          include: {
            _count: {
              select: { collectionListings: true },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    if (client.advisorId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        preferredCategories: client.preferredCategories,
        preferredBoroughs: client.preferredBoroughs,
        priceRangeMin: client.priceRangeMin ? Number(client.priceRangeMin) : null,
        priceRangeMax: client.priceRangeMax ? Number(client.priceRangeMax) : null,
        revenueRangeMin: client.revenueRangeMin ? Number(client.revenueRangeMin) : null,
        revenueRangeMax: client.revenueRangeMax ? Number(client.revenueRangeMax) : null,
        notes: client.notes,
        collections: client.collections.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          listingCount: c._count.collectionListings,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
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

// PUT: Update a client's fields
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

    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    if (client.advisorId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      company,
      preferredCategories,
      preferredBoroughs,
      priceRangeMin,
      priceRangeMax,
      revenueRangeMin,
      revenueRangeMax,
      notes,
    } = body;

    // Validate email if provided
    if (email !== undefined) {
      if (!email || typeof email !== "string" || !email.trim()) {
        return NextResponse.json(
          { success: false, error: "Client email cannot be empty" },
          { status: 400 }
        );
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { success: false, error: "Invalid email format" },
          { status: 400 }
        );
      }

      // Check uniqueness if email is changing
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== client.email) {
        const existing = await prisma.client.findUnique({
          where: {
            advisorId_email: {
              advisorId: session.user.id,
              email: normalizedEmail,
            },
          },
        });
        if (existing) {
          return NextResponse.json(
            { success: false, error: "A client with this email already exists" },
            { status: 409 }
          );
        }
      }
    }

    // Build update data - only include provided fields
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name?.trim() || client.name;
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (company !== undefined) updateData.company = company?.trim() || null;
    if (preferredCategories !== undefined)
      updateData.preferredCategories = Array.isArray(preferredCategories) ? preferredCategories : [];
    if (preferredBoroughs !== undefined)
      updateData.preferredBoroughs = Array.isArray(preferredBoroughs) ? preferredBoroughs : [];
    if (priceRangeMin !== undefined) updateData.priceRangeMin = priceRangeMin;
    if (priceRangeMax !== undefined) updateData.priceRangeMax = priceRangeMax;
    if (revenueRangeMin !== undefined) updateData.revenueRangeMin = revenueRangeMin;
    if (revenueRangeMax !== undefined) updateData.revenueRangeMax = revenueRangeMax;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;

    const updated = await prisma.client.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        company: updated.company,
        preferredCategories: updated.preferredCategories,
        preferredBoroughs: updated.preferredBoroughs,
        priceRangeMin: updated.priceRangeMin ? Number(updated.priceRangeMin) : null,
        priceRangeMax: updated.priceRangeMax ? Number(updated.priceRangeMax) : null,
        revenueRangeMin: updated.revenueRangeMin ? Number(updated.revenueRangeMin) : null,
        revenueRangeMax: updated.revenueRangeMax ? Number(updated.revenueRangeMax) : null,
        notes: updated.notes,
        updatedAt: updated.updatedAt,
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

// DELETE: Delete a client and unlink their collections
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

    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    if (client.advisorId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Unlink collections (set clientId to null) before deleting
    await prisma.collection.updateMany({
      where: { clientId: id },
      data: { clientId: null },
    });

    // Delete the client record
    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { deletedClientId: id, deletedClientEmail: client.email },
    });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete client" },
      { status: 500 }
    );
  }
}
