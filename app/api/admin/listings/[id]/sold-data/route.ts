import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

// PUT: Add sold price and date
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
    const { soldPrice, soldDate } = body;

    if (typeof soldPrice !== "number" || soldPrice <= 0) {
      return NextResponse.json(
        { success: false, error: "soldPrice must be a positive number" },
        { status: 400 }
      );
    }

    if (!soldDate || typeof soldDate !== "string") {
      return NextResponse.json(
        { success: false, error: "soldDate must be a valid date string" },
        { status: 400 }
      );
    }

    const parsedDate = new Date(soldDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "soldDate is not a valid date" },
        { status: 400 }
      );
    }

    const updated = await prisma.businessListing.update({
      where: { id },
      data: {
        soldPrice,
        soldDate: parsedDate,
        status: "SOLD",
      },
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
    console.error("Admin listing sold-data error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update sold data" },
      { status: 500 }
    );
  }
}
