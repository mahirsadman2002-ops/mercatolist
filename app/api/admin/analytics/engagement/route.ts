import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const [
      viewsResult,
      totalInquiries,
      totalMessages,
      topViewedListings,
      topSavedListings,
      topInquiredListingsRaw,
    ] = await Promise.all([
      // Sum of all listing viewCounts
      prisma.businessListing.aggregate({
        _sum: { viewCount: true },
      }),

      // Total inquiries
      prisma.inquiry.count(),

      // Total messages
      prisma.message.count(),

      // Top 10 most viewed listings
      prisma.businessListing.findMany({
        orderBy: { viewCount: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          slug: true,
          viewCount: true,
          category: true,
        },
      }),

      // Top 10 most saved listings
      prisma.businessListing.findMany({
        orderBy: { saveCount: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          slug: true,
          saveCount: true,
          category: true,
        },
      }),

      // Top 10 most inquired listings (by inquiry count)
      prisma.businessListing.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          _count: {
            select: { inquiries: true },
          },
        },
        orderBy: { inquiries: { _count: "desc" } },
        take: 10,
      }),
    ]);

    const totalViews = viewsResult._sum.viewCount ?? 0;

    const topInquiredListings = topInquiredListingsRaw.map((listing) => ({
      id: listing.id,
      title: listing.title,
      slug: listing.slug,
      inquiryCount: listing._count.inquiries,
      category: listing.category,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalViews,
        totalInquiries,
        totalMessages,
        topViewedListings,
        topSavedListings,
        topInquiredListings,
      },
    });
  } catch (error) {
    console.error("Admin analytics engagement error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch engagement analytics" },
      { status: 500 }
    );
  }
}
