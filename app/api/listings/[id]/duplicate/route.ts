import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify, generateShareToken } from "@/lib/utils";

export async function POST(
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
      include: { photos: true },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    if (listing.listedById !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Not authorized to duplicate this listing" },
        { status: 403 }
      );
    }

    // Generate a unique slug
    const baseSlug = slugify(`${listing.title} copy`);
    let slug = baseSlug;
    const existingSlug = await prisma.businessListing.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      slug = `${baseSlug}-${Date.now().toString(36)}`;
    }

    // Reset per-listing identity/metrics on the copy. listingNumber is @unique
    // and auto-incremented, so it MUST be dropped (copying it would violate the
    // constraint / collide). The copy starts as a DRAFT — the owner reviews and
    // publishes it, which routes through the verified-email publish gate rather
    // than silently going live and bypassing it.
    const {
      id: _id,
      slug: _slug,
      listingNumber: _listingNumber,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      viewCount: _viewCount,
      saveCount: _saveCount,
      shareCount: _shareCount,
      soldPrice: _soldPrice,
      soldDate: _soldDate,
      lastStatusConfirmation: _lastConf,
      statusConfirmationDue: _confDue,
      shareToken: _shareToken,
      ...listingData
    } = listing;

    const duplicate = await prisma.businessListing.create({
      data: {
        ...listingData,
        slug,
        status: "DRAFT",
        // A ghost listing must keep a real share token — otherwise the copy has
        // shareToken=null and the public GET's `token !== shareToken` guard
        // passes for a tokenless visitor, exposing an "unlisted" listing.
        shareToken: listing.isGhostListing ? generateShareToken() : null,
        title: `${listing.title} (Copy)`,
        photos: {
          create: listing.photos.map((photo) => ({
            url: photo.url,
            order: photo.order,
          })),
        },
      },
      include: { photos: true },
    });

    return NextResponse.json(
      { success: true, data: duplicate },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error duplicating listing:", error);
    return NextResponse.json(
      { success: false, error: "Failed to duplicate listing" },
      { status: 500 }
    );
  }
}
