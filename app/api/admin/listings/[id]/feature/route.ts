import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

// PUT: Toggle featured status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminAuth = await requireAdmin();
    if (!adminAuth.authorized) return adminAuth.response;

    const { id } = await params;

    // Read current isFeatured value
    const listing = await prisma.businessListing.findUnique({
      where: { id },
      select: { isFeatured: true },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    // Toggle to opposite value
    const newValue = !listing.isFeatured;

    await prisma.businessListing.update({
      where: { id },
      data: { isFeatured: newValue },
    });

    return NextResponse.json({
      success: true,
      data: { isFeatured: newValue },
    });
  } catch (error) {
    console.error("Admin listing feature toggle error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle featured status" },
      { status: 500 }
    );
  }
}
