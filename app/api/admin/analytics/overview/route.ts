import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const now = new Date();

    // 7 days ago
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // 30 days ago
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Run independent queries in parallel
    const [
      totalActiveListings,
      totalUsers,
      inquiriesThisWeek,
      pendingReports,
      overdueConfirmations,
      unresolvedReports,
      staleListings,
      recentListings,
      recentInquiries,
      recentReports,
      recentUsers,
      weeklyListingsRaw,
      weeklyUsersRaw,
    ] = await Promise.all([
      // Total active listings
      prisma.businessListing.count({
        where: { status: "ACTIVE" },
      }),

      // Total users
      prisma.user.count(),

      // Inquiries this week
      prisma.inquiry.count({
        where: { createdAt: { gte: oneWeekAgo } },
      }),

      // Pending reports
      prisma.report.count({
        where: { status: "PENDING" },
      }),

      // Overdue confirmations (statusConfirmationDue is in the past and listing is ACTIVE)
      prisma.businessListing.count({
        where: {
          status: "ACTIVE",
          statusConfirmationDue: { lt: now },
        },
      }),

      // Unresolved reports (PENDING or REVIEWED)
      prisma.report.count({
        where: { status: { in: ["PENDING", "REVIEWED"] } },
      }),

      // Stale listings: ACTIVE, created over 30 days ago, with 0 inquiries
      prisma.businessListing.count({
        where: {
          status: "ACTIVE",
          createdAt: { lt: thirtyDaysAgo },
          inquiries: { none: {} },
        },
      }),

      // Recent listings (last 20)
      prisma.businessListing.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          createdAt: true,
          listedBy: { select: { name: true } },
        },
      }),

      // Recent inquiries (last 20)
      prisma.inquiry.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          type: true,
          createdAt: true,
          listing: { select: { title: true, slug: true } },
          sender: { select: { name: true } },
          senderName: true,
        },
      }),

      // Recent reports (last 20)
      prisma.report.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          type: true,
          reason: true,
          status: true,
          createdAt: true,
          reporter: { select: { name: true } },
        },
      }),

      // Recent users (last 20)
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),

      // Weekly listings data for the past 12 weeks
      prisma.businessListing.findMany({
        where: {
          createdAt: {
            gte: new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: { createdAt: true },
      }),

      // Weekly users data for the past 12 weeks
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: { createdAt: true },
      }),
    ]);

    // Build recent activity: merge and sort by timestamp
    const recentActivity = [
      ...recentListings.map((l) => ({
        id: l.id,
        type: "listing_created" as const,
        description: `New listing "${l.title}" in ${l.category} by ${l.listedBy.name}`,
        timestamp: l.createdAt,
        metadata: { slug: l.slug, category: l.category },
      })),
      ...recentInquiries.map((i) => ({
        id: i.id,
        type: "inquiry_sent" as const,
        description: `Inquiry on "${i.listing.title}" from ${i.sender?.name || i.senderName || "Anonymous"}`,
        timestamp: i.createdAt,
        metadata: { listingSlug: i.listing.slug, inquiryType: i.type },
      })),
      ...recentReports.map((r) => ({
        id: r.id,
        type: "report_filed" as const,
        description: `${r.type} report (${r.reason}) filed by ${r.reporter.name}`,
        timestamp: r.createdAt,
        metadata: { reportType: r.type, reason: r.reason, status: r.status },
      })),
      ...recentUsers.map((u) => ({
        id: u.id,
        type: "user_registered" as const,
        description: `New ${u.role.toLowerCase()} registered: ${u.name}`,
        timestamp: u.createdAt,
        metadata: { role: u.role, email: u.email },
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);

    // Build weekly chart data for the past 12 weeks
    const weeklyChartData: { week: string; listings: number; users: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

      const listingsCount = weeklyListingsRaw.filter(
        (l) => l.createdAt >= weekStart && l.createdAt < weekEnd
      ).length;

      const usersCount = weeklyUsersRaw.filter(
        (u) => u.createdAt >= weekStart && u.createdAt < weekEnd
      ).length;

      const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      weeklyChartData.push({ week: label, listings: listingsCount, users: usersCount });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalActiveListings,
        totalUsers,
        inquiriesThisWeek,
        pendingReports,
        overdueConfirmations,
        unresolvedReports,
        staleListings,
        recentActivity,
        weeklyChartData,
      },
    });
  } catch (error) {
    console.error("Admin analytics overview error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics overview" },
      { status: 500 }
    );
  }
}
