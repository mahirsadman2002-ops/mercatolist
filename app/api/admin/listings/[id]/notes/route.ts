import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

// PUT: Update admin notes
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
    const { adminNotes } = body;

    if (typeof adminNotes !== "string") {
      return NextResponse.json(
        { success: false, error: "adminNotes must be a string" },
        { status: 400 }
      );
    }

    const updated = await prisma.businessListing.update({
      where: { id },
      data: { adminNotes },
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
    console.error("Admin listing notes error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update admin notes" },
      { status: 500 }
    );
  }
}
