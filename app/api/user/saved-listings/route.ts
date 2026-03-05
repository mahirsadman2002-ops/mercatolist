import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "24");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (status && status !== "ALL") {
      where.listing = { status };
    }

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
      data: savedListings,
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

    if (!Array.isArray(listingIds) || listingIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No listing IDs provided" },
        { status: 400 }
      );
    }

    await prisma.savedListing.deleteMany({
      where: {
        userId: session.user.id,
        listingId: { in: listingIds },
      },
    });

    // Decrement save counts
    await prisma.businessListing.updateMany({
      where: { id: { in: listingIds } },
      data: { saveCount: { decrement: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error bulk unsaving:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove saved listings" },
      { status: 500 }
    );
  }
}
