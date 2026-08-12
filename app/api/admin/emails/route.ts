import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Prisma } from "@prisma/client";

// GET: paginated outbound-email log for the admin Emails page.
export async function GET(request: NextRequest) {
  const { authorized, response } = await requireAdmin();
  if (!authorized) return response;

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const status = searchParams.get("status");
    const template = searchParams.get("template");
    const q = searchParams.get("q");

    const where: Prisma.EmailLogWhereInput = {};
    if (status && status !== "all")
      where.status = status as Prisma.EmailLogWhereInput["status"];
    if (template && template !== "all") where.template = template;
    if (q) {
      where.OR = [
        { to: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [emails, total, sentToday, sentWeek, failedWeek, templates] =
      await Promise.all([
        prisma.emailLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.emailLog.count({ where }),
        prisma.emailLog.count({
          where: { status: "SENT", createdAt: { gte: dayAgo } },
        }),
        prisma.emailLog.count({
          where: { status: "SENT", createdAt: { gte: weekAgo } },
        }),
        prisma.emailLog.count({
          where: { status: "FAILED", createdAt: { gte: weekAgo } },
        }),
        prisma.emailLog.findMany({
          where: { template: { not: null } },
          distinct: ["template"],
          select: { template: true },
          orderBy: { template: "asc" },
        }),
      ]);

    return NextResponse.json({
      success: true,
      data: emails,
      stats: { sentToday, sentWeek, failedWeek },
      templates: templates.map((t) => t.template),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin emails error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load email log" },
      { status: 500 }
    );
  }
}
