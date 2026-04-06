import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const advisor = await prisma.user.findUnique({
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
        boroughsServed: true,
        specialties: true,
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
        licenses: {
          where: { isVerified: true },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            issuingAuthority: true,
            licenseNumber: true,
            expirationDate: true,
            isVerified: true,
            verifiedAt: true,
          },
        },
        pastDeals: {
          orderBy: { dateSold: "desc" },
          select: {
            id: true,
            businessName: true,
            category: true,
            borough: true,
            neighborhood: true,
            salePrice: true,
            dateSold: true,
            isVerified: true,
          },
        },
      },
    });

    if (!advisor) {
      return NextResponse.json(
        { success: false, error: "Advisor not found" },
        { status: 404 }
      );
    }

    // Calculate stats
    const activeListings = advisor.listings.filter(
      (l) => l.status === "ACTIVE"
    );
    const soldListings = advisor.listings.filter((l) => l.status === "SOLD");
    const underContractListings = advisor.listings.filter(
      (l) => l.status === "UNDER_CONTRACT"
    );

    const reviews = advisor.receivedReviews;
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    // Rating breakdown
    const ratingBreakdown = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: reviews.filter((r) => r.rating === rating).length,
    }));

    // Serialize past deals
    const pastDeals = advisor.pastDeals.map((deal) => ({
      ...deal,
      salePrice: deal.salePrice ? Number(deal.salePrice) : null,
      dateSold: deal.dateSold?.toISOString() || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        id: advisor.id,
        name: advisor.displayName || advisor.name,
        bio: advisor.bio,
        avatarUrl: advisor.avatarUrl,
        phone: advisor.phone,
        brokerageName: advisor.brokerageName,
        brokerageWebsite: advisor.brokerageWebsite,
        brokeragePhone: advisor.brokeragePhone,
        boroughsServed: advisor.boroughsServed,
        specialties: advisor.specialties,
        instagramUrl: advisor.instagramUrl,
        linkedinUrl: advisor.linkedinUrl,
        twitterUrl: advisor.twitterUrl,
        facebookUrl: advisor.facebookUrl,
        tiktokUrl: advisor.tiktokUrl,
        memberSince: advisor.createdAt,
        stats: {
          totalListings: advisor.listings.length,
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
        licenses: advisor.licenses,
        pastDeals,
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
