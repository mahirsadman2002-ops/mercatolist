import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const broker = await prisma.user.findUnique({
      where: { id, role: "BROKER" },
      select: {
        id: true,
        name: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        phone: true,
        role: true,
        brokerageName: true,
        brokerageWebsite: true,
        brokeragePhone: true,
        instagramUrl: true,
        linkedinUrl: true,
        twitterUrl: true,
        facebookUrl: true,
        tiktokUrl: true,
        createdAt: true,
        listings: {
          where: { isGhostListing: false },
          orderBy: { createdAt: "desc" },
          include: {
            photos: { orderBy: { order: "asc" }, take: 1 },
            listedBy: {
              select: {
                id: true,
                name: true,
                displayName: true,
                role: true,
                brokerageName: true,
              },
            },
          },
        },
        receivedReviews: {
          orderBy: { createdAt: "desc" },
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!broker) {
      return NextResponse.json(
        { success: false, error: "Advisor not found" },
        { status: 404 }
      );
    }

    // Calculate stats
    const activeListings = broker.listings.filter(
      (l) => l.status === "ACTIVE"
    );
    const soldListings = broker.listings.filter((l) => l.status === "SOLD");
    const underContractListings = broker.listings.filter(
      (l) => l.status === "UNDER_CONTRACT"
    );

    const reviews = broker.receivedReviews;
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    // Rating breakdown
    const ratingBreakdown = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: reviews.filter((r) => r.rating === rating).length,
    }));

    return NextResponse.json({
      success: true,
      data: {
        id: broker.id,
        name: broker.displayName || broker.name,
        bio: broker.bio,
        avatarUrl: broker.avatarUrl,
        phone: broker.phone,
        brokerageName: broker.brokerageName,
        brokerageWebsite: broker.brokerageWebsite,
        brokeragePhone: broker.brokeragePhone,
        instagramUrl: broker.instagramUrl,
        linkedinUrl: broker.linkedinUrl,
        twitterUrl: broker.twitterUrl,
        facebookUrl: broker.facebookUrl,
        tiktokUrl: broker.tiktokUrl,
        memberSince: broker.createdAt,
        stats: {
          totalListings: broker.listings.length,
          activeListings: activeListings.length,
          dealsClosed: soldListings.length,
          reviewCount: reviews.length,
          avgRating: Math.round(avgRating * 10) / 10,
        },
        ratingBreakdown,
        activeListings,
        underContractListings,
        soldListings,
        reviews,
      },
    });
  } catch (error) {
    console.error("Error fetching advisor:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch advisor" },
      { status: 500 }
    );
  }
}
