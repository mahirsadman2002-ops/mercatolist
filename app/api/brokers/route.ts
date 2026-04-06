import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const borough = searchParams.get("borough") || "";
    const sort = searchParams.get("sort") || "most_reviews";
    const skip = (page - 1) * limit;

    // Build where clause for brokers
    const where: Record<string, unknown> = { role: "BROKER" };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
        { brokerageName: { contains: search, mode: "insensitive" } },
      ];
    }

    // Borough filter: filter brokers who serve the given borough
    if (borough) {
      where.boroughsServed = {
        has: borough,
      };
    }

    const brokers = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        displayName: true,
        avatarUrl: true,
        phone: true,
        brokerageName: true,
        brokeragePhone: true,
        boroughsServed: true,
        specialties: true,
        createdAt: true,
        listings: {
          where: { isGhostListing: false, status: "ACTIVE" },
          select: { id: true },
        },
        receivedReviews: {
          select: { rating: true },
        },
      },
    });

    const total = await prisma.user.count({ where });

    // Map and compute stats
    let results = brokers.map((broker) => {
      const reviews = broker.receivedReviews;
      const avgRating =
        reviews.length > 0
          ? Math.round(
              (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) *
                10
            ) / 10
          : 0;

      return {
        id: broker.id,
        name: broker.displayName || broker.name,
        avatarUrl: broker.avatarUrl,
        phone: broker.phone,
        brokerageName: broker.brokerageName,
        brokeragePhone: broker.brokeragePhone,
        activeListings: broker.listings.length,
        reviewCount: reviews.length,
        avgRating,
        memberSince: broker.createdAt,
      };
    });

    // Sort
    switch (sort) {
      case "most_reviews":
        results.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "highest_rated":
        results.sort((a, b) => b.avgRating - a.avgRating);
        break;
      case "most_listings":
        results.sort((a, b) => b.activeListings - a.activeListings);
        break;
      case "newest":
        results.sort(
          (a, b) =>
            new Date(b.memberSince).getTime() -
            new Date(a.memberSince).getTime()
        );
        break;
    }

    return NextResponse.json({
      success: true,
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching advisors:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch advisors" },
      { status: 500 }
    );
  }
}
