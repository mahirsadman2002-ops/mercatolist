import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { sendStatusConfirmationEmail } from "@/lib/listing-confirmation";

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

    // Actually send the confirmation email and bump the non-response counters.
    await sendStatusConfirmationEmail(listing);

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
