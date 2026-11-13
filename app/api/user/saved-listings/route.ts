import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { applyAddressPrivacy } from "@/lib/address-privacy";

const PUBLIC_STATUSES = ["ACTIVE", "UNDER_CONTRACT", "SOLD"];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || "savedAt";
    const status = searchParams.get("status") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "24") || 24));
    const skip = (page - 1) * limit;

    // Only listings the viewer could open anyway: public ones, plus their own.
    // (Deleted, drafted, off-market or private listings drop out of the list.)
    const visible = {
      deletedAt: null,
      OR: [
        { listedById: session.user.id },
        { isGhostListing: false, status: { in: PUBLIC_STATUSES as any[] } },
      ],
    };
    const where: Record<string, unknown> = {
      userId: session.user.id,
      listing:
        status && status !== "ALL" && PUBLIC_STATUSES.includes(status)
          ? { ...visible, status }
          : visible,
    };

    // Determine ordering
    let orderBy: Record<string, unknown> = { createdAt: "desc" };
    if (sort === "priceAsc") {
      orderBy = { listing: { askingPrice: "asc" } };
    } else if (sort === "priceDesc") {
      orderBy = { listing: { askingPrice: "desc" } };
    }

    const [savedListings, total] = await Promise.all([
      prisma.savedListing.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          listing: {
            include: {
              photos: { orderBy: { order: "asc" }, take: 3 },
              listedBy: {
                select: {
                  name: true,
                  displayName: true,
                  role: true,
                  brokerageName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
      prisma.savedListing.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      // Same scrubbing as the public listing API: hidden addresses stay
      // hidden and admin-only columns never leave the server.
      data: savedListings.map((s) => ({
        ...s,
        listing:
          s.listing.listedById === session.user.id
            ? s.listing
            : applyAddressPrivacy(s.listing as any),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching saved listings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch saved listings" },
      { status: 500 }
    );
  }
}

// DELETE: Bulk unsave
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { listingIds } = body;

    if (
      !Array.isArray(listingIds) ||
      listingIds.length === 0 ||
      listingIds.length > 200 ||
      !listingIds.every((id) => typeof id === "string")
    ) {
      return NextResponse.json(
        { success: false, error: "No listing IDs provided" },
        { status: 400 }
      );
    }

    // Only the caller's own saves count — otherwise anyone could push any
    // listing's public save count down by sending its id here.
    const saved = await prisma.savedListing.findMany({
      where: { userId: session.user.id, listingId: { in: listingIds } },
      select: { listingId: true },
    });
    const savedIds = saved.map((s) => s.listingId);

    if (savedIds.length > 0) {
      await prisma.savedListing.deleteMany({
        where: { userId: session.user.id, listingId: { in: savedIds } },
      });
      await prisma.businessListing.updateMany({
        where: { id: { in: savedIds }, saveCount: { gt: 0 } },
        data: { saveCount: { decrement: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error bulk unsaving:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove saved listings" },
      { status: 500 }
    );
  }
}
