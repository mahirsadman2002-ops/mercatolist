import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyName: string }> }
) {
  try {
    const { companyName } = await params;
    const decoded = decodeURIComponent(companyName);

    // Query advisors where role is BROKER and brokerageName matches (case-insensitive)
    const advisors = await prisma.user.findMany({
      where: {
        role: "BROKER",
        brokerageName: {
          equals: decoded,
          mode: "insensitive",
        },
      },
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
      orderBy: { createdAt: "asc" },
    });

    const results = advisors.map((advisor) => {
      const reviews = advisor.receivedReviews;
      const avgRating =
        reviews.length > 0
          ? Math.round(
              (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) *
                10
            ) / 10
          : 0;

      return {
        id: advisor.id,
        name: advisor.displayName || advisor.name,
        avatarUrl: advisor.avatarUrl,
        phone: advisor.phone,
        brokerageName: advisor.brokerageName,
        brokeragePhone: advisor.brokeragePhone,
        boroughsServed: advisor.boroughsServed,
        specialties: advisor.specialties,
        activeListings: advisor.listings.length,
        reviewCount: reviews.length,
        avgRating,
      };
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching company advisors:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch company advisors" },
      { status: 500 }
    );
  }
}
