import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { adminListingUpdateSchema } from "@/lib/validations";

// PUT: Update listing fields
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminAuth = await requireAdmin();
    if (!adminAuth.authorized) return adminAuth.response;

    const { id } = await params;

    // Verify listing exists
    const existing = await prisma.businessListing.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = adminListingUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { ...parsed.data };

    // If status is being changed to SOLD and soldDate is provided, parse it
    if (updateData.status === "SOLD" && updateData.soldDate) {
      updateData.soldDate = new Date(updateData.soldDate as string);
    } else if (updateData.soldDate) {
      updateData.soldDate = new Date(updateData.soldDate as string);
    }

    const updated = await prisma.businessListing.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        askingPrice: Number(updated.askingPrice),
        annualRevenue: updated.annualRevenue ? Number(updated.annualRevenue) : null,
        soldPrice: updated.soldPrice ? Number(updated.soldPrice) : null,
        latitude: Number(updated.latitude),
        longitude: Number(updated.longitude),
      },
    });
  } catch (error) {
    console.error("Admin listing PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update listing" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a listing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminAuth = await requireAdmin();
    if (!adminAuth.authorized) return adminAuth.response;

    const { id } = await params;

    // Verify listing exists
    const existing = await prisma.businessListing.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    await prisma.businessListing.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error("Admin listing DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete listing" },
      { status: 500 }
    );
  }
}
