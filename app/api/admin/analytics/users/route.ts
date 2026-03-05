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

    // Start of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 7 days ago
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // 12 weeks ago
    const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newThisMonth,
      newThisWeek,
      userRoleCount,
      brokerRoleCount,
      adminRoleCount,
      weeklyUsersRaw,
      topBrokersRaw,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // New users this month
      prisma.user.count({
        where: { createdAt: { gte: startOfMonth } },
      }),

      // New users this week
      prisma.user.count({
        where: { createdAt: { gte: oneWeekAgo } },
      }),

      // Count by role
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { role: "BROKER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),

      // Users created in the past 12 weeks (for growth chart)
      prisma.user.findMany({
        where: { createdAt: { gte: twelveWeeksAgo } },
        select: { createdAt: true },
      }),

      // Top 10 brokers by listing count
      prisma.user.findMany({
        where: { role: "BROKER" },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          _count: {
            select: {
              listings: true,
              receivedInquiries: true,
            },
          },
        },
        orderBy: { listings: { _count: "desc" } },
        take: 10,
      }),
    ]);

    const byRole = {
      USER: userRoleCount,
      BROKER: brokerRoleCount,
      ADMIN: adminRoleCount,
    };

    // Build weekly growth data for the past 12 weeks
    const growthData: { week: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

      const count = weeklyUsersRaw.filter(
        (u) => u.createdAt >= weekStart && u.createdAt < weekEnd
      ).length;

      const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      growthData.push({ week: label, count });
    }

    // Format top brokers
    const topBrokers = topBrokersRaw.map((broker) => ({
      id: broker.id,
      name: broker.name,
      email: broker.email,
      avatarUrl: broker.avatarUrl,
      listingCount: broker._count.listings,
      inquiryCount: broker._count.receivedInquiries,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        newThisMonth,
        newThisWeek,
        byRole,
        growthData,
        topBrokers,
      },
    });
  } catch (error) {
    console.error("Admin analytics users error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user analytics" },
      { status: 500 }
    );
  }
}
