import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { statusChangeSchema, getMissingListingFields } from "@/lib/validations";
import { requireVerifiedEmail } from "@/lib/require-verified";
import { validateNycLocation } from "@/lib/nyc-geo";

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
      select: {
        listedById: true,
        status: true,
        // Needed to validate completeness before allowing publish.
        title: true,
        description: true,
        category: true,
        askingPrice: true,
        address: true,
        neighborhood: true,
        borough: true,
        zipCode: true,
        latitude: true,
        longitude: true,
      },
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

    // A draft isn't live yet, so its only valid transition is to publish
    // (ACTIVE). It can't jump straight to Under Contract / Sold / Off Market —
    // those only make sense once the listing has actually gone live.
    if (listing.status === "DRAFT" && validated.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          error: "Publish this listing before changing its status.",
        },
        { status: 400 }
      );
    }

    // Making a listing live (ACTIVE) requires a verified email AND a complete
    // listing — a half-filled draft can't be published into a broken public
    // page.
    if (validated.status === "ACTIVE") {
      const verified = await requireVerifiedEmail(session.user.id, "publish a listing");
      if (!verified.verified) return verified.response;

      const missing = getMissingListingFields(listing);
      if (missing.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Complete these before publishing: ${missing.join(", ")}.`,
            missingFields: missing,
          },
          { status: 400 }
        );
      }

      // Geo-lock: only businesses in the five NYC boroughs can go live.
      const geo = validateNycLocation({
        borough: listing.borough,
        zipCode: listing.zipCode,
        latitude: listing.latitude as unknown as number,
        longitude: listing.longitude as unknown as number,
      });
      if (!geo.ok) {
        return NextResponse.json(
          { success: false, error: geo.error },
          { status: 400 }
        );
      }
    }

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
