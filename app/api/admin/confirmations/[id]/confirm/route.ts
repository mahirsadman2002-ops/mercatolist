import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { CONFIRMATION_INTERVAL_DAYS } from "@/lib/listing-confirmation";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, response, userId } = await requireAdmin();
  if (!authorized) return response;

  try {
    const { id } = await params;

    const listing = await prisma.businessListing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const nextDue = new Date(
      now.getTime() + CONFIRMATION_INTERVAL_DAYS * 24 * 60 * 60 * 1000
    );

    const [updatedListing] = await prisma.$transaction([
      prisma.businessListing.update({
        where: { id },
        data: {
          lastStatusConfirmation: now,
          statusConfirmationDue: nextDue,
          confirmationRemindersSent: 0,
        },
      }),
      prisma.listingStatusLog.create({
        data: {
          listingId: id,
          confirmedById: userId!,
          previousStatus: listing.status,
          confirmedStatus: listing.status,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: updatedListing,
    });
  } catch (error) {
    console.error("Error confirming listing:", error);
    return NextResponse.json(
      { success: false, error: "Failed to confirm listing" },
      { status: 500 }
    );
  }
}
