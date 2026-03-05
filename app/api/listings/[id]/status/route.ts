import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { statusChangeSchema } from "@/lib/validations";

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

    const listing = await prisma.businessListing.findUnique({
      where: { id },
      select: { listedById: true, status: true },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    if (listing.listedById !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Not authorized to modify this listing" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = statusChangeSchema.parse(body);

    const updateData: Record<string, unknown> = {
      status: validated.status,
    };

    if (validated.status === "SOLD") {
      if (validated.soldPrice) updateData.soldPrice = validated.soldPrice;
      if (validated.soldDate) updateData.soldDate = new Date(validated.soldDate);
    }

    const updated = await prisma.businessListing.update({
      where: { id },
      data: updateData,
    });

    // Log the status change
    await prisma.listingStatusLog.create({
      data: {
        listingId: id,
        confirmedById: session.user.id,
        previousStatus: listing.status,
        confirmedStatus: validated.status,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    console.error("Error updating listing status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update status" },
      { status: 500 }
    );
  }
}
