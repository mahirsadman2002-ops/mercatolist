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
      totalSearches,
      zeroResultCount,
      topSearchesRaw,
      zeroResultSearchesRaw,
    ] = await Promise.all([
      // Total logged searches
      prisma.searchLog.count(),

      // Searches that returned nothing (unmet demand)
      prisma.searchLog.count({ where: { resultCount: 0 } }),

      // Most common non-empty keyword searches
      prisma.searchLog.groupBy({
        by: ["query"],
        where: { query: { not: "" } },
        _count: { query: true },
        orderBy: { _count: { query: "desc" } },
        take: 20,
      }),

      // Most common keyword searches that returned zero results
      prisma.searchLog.groupBy({
        by: ["query"],
        where: { query: { not: "" }, resultCount: 0 },
        _count: { query: true },
        orderBy: { _count: { query: "desc" } },
        take: 20,
      }),
    ]);

    const topSearches = topSearchesRaw.map((row) => ({
      query: row.query,
      count: row._count.query,
    }));

    const zeroResultSearches = zeroResultSearchesRaw.map((row) => ({
      query: row.query,
      count: row._count.query,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalSearches,
        zeroResultCount,
        topSearches,
        zeroResultSearches,
      },
    });
  } catch (error) {
    console.error("Admin analytics searches error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch search analytics" },
      { status: 500 }
    );
  }
}
