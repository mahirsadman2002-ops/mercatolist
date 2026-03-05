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
      activeCount,
      underContractCount,
      soldCount,
      offMarketCount,
      categoryGroups,
      boroughGroups,
      avgPriceResult,
      totalListings,
      soldListings,
    ] = await Promise.all([
      // Count by status
      prisma.businessListing.count({ where: { status: "ACTIVE" } }),
      prisma.businessListing.count({ where: { status: "UNDER_CONTRACT" } }),
      prisma.businessListing.count({ where: { status: "SOLD" } }),
      prisma.businessListing.count({ where: { status: "OFF_MARKET" } }),

      // Top 15 categories by count
      prisma.businessListing.groupBy({
        by: ["category"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 15,
      }),

      // Count by borough
      prisma.businessListing.groupBy({
        by: ["borough"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),

      // Average asking price
      prisma.businessListing.aggregate({
        _avg: { askingPrice: true },
      }),

      // Total listings (for sell-through rate)
      prisma.businessListing.count(),

      // Sold listings count
      prisma.businessListing.count({ where: { status: "SOLD" } }),
    ]);

    const byStatus = {
      ACTIVE: activeCount,
      UNDER_CONTRACT: underContractCount,
      SOLD: soldCount,
      OFF_MARKET: offMarketCount,
    };

    const byCategory = categoryGroups.map((group) => ({
      category: group.category,
      count: group._count.id,
    }));

    const byBorough = boroughGroups.map((group) => ({
      borough: group.borough,
      count: group._count.id,
    }));

    const avgAskingPrice = avgPriceResult._avg.askingPrice
      ? Number(avgPriceResult._avg.askingPrice)
      : 0;

    const sellThroughRate =
      totalListings > 0
        ? Number(((soldListings / totalListings) * 100).toFixed(2))
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        byStatus,
        byCategory,
        byBorough,
        avgAskingPrice,
        sellThroughRate,
      },
    });
  } catch (error) {
    console.error("Admin analytics listings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch listing analytics" },
      { status: 500 }
    );
  }
}
