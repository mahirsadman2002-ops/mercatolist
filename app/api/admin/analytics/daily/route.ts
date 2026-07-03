import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

// Daily time series for the admin dashboard: site visits, new listings, new
// users, and inquiries sent — one point per day for the requested window.

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const daysParam = parseInt(
      new URL(request.url).searchParams.get("days") || "30",
      10
    );
    const days = Math.min(Math.max(daysParam || 30, 1), 90);

    const now = new Date();
    // Start at midnight UTC, (days-1) back, so the window includes today.
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    start.setUTCDate(start.getUTCDate() - (days - 1));

    // Pre-seed every day in range with zeros so the chart has no gaps.
    const buckets: Record<
      string,
      { date: string; visits: number; listings: number; users: number; inquiries: number }
    > = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      buckets[dayKey(d)] = {
        date: dayKey(d),
        visits: 0,
        listings: 0,
        users: 0,
        inquiries: 0,
      };
    }

    const [visits, listings, users, inquiries] = await Promise.all([
      // Visits are pre-bucketed by day string in the DB — just count per day.
      prisma.dailyVisit.groupBy({
        by: ["day"],
        where: { day: { gte: dayKey(start) } },
        _count: { _all: true },
      }),
      prisma.businessListing.findMany({
        where: { createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      prisma.inquiry.findMany({
        where: { createdAt: { gte: start } },
        select: { createdAt: true },
      }),
    ]);

    for (const v of visits) {
      if (buckets[v.day]) buckets[v.day].visits = v._count._all;
    }
    for (const l of listings) {
      const k = dayKey(l.createdAt);
      if (buckets[k]) buckets[k].listings += 1;
    }
    for (const u of users) {
      const k = dayKey(u.createdAt);
      if (buckets[k]) buckets[k].users += 1;
    }
    for (const inq of inquiries) {
      const k = dayKey(inq.createdAt);
      if (buckets[k]) buckets[k].inquiries += 1;
    }

    const series = Object.values(buckets).sort((a, b) =>
      a.date < b.date ? -1 : 1
    );

    const totals = series.reduce(
      (acc, d) => ({
        visits: acc.visits + d.visits,
        listings: acc.listings + d.listings,
        users: acc.users + d.users,
        inquiries: acc.inquiries + d.inquiries,
      }),
      { visits: 0, listings: 0, users: 0, inquiries: 0 }
    );

    return NextResponse.json({ success: true, data: { days, series, totals } });
  } catch (error) {
    console.error("Error building daily analytics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to build daily analytics" },
      { status: 500 }
    );
  }
}
