import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, response } = await requireAdmin();
  if (!authorized) return response;

  try {
    const { id } = await params;

    const listing = await prisma.businessListing.findUnique({
      where: { id },
      include: {
        listedBy: {
          select: { name: true, email: true },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    // Placeholder: log the reminder email instead of sending
    console.log(
      `[Reminder] Sending status confirmation reminder to ${listing.listedBy.email} for listing "${listing.title}" (ID: ${listing.id})`
    );

    return NextResponse.json({
      success: true,
      data: { message: "Reminder sent" },
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send reminder" },
      { status: 500 }
    );
  }
}
