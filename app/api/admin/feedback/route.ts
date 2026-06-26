import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { authorized, response } = await requireAdmin();
  if (!authorized) return response;

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const where: Prisma.FeedbackWhereInput = {};
    if (type && type !== "all") where.type = type as Prisma.FeedbackWhereInput["type"];
    if (status && status !== "all") where.status = status as Prisma.FeedbackWhereInput["status"];

    const skip = (page - 1) * limit;

    const [feedback, total, newCount] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.feedback.count({ where }),
      prisma.feedback.count({ where: { status: "NEW" } }),
    ]);

    return NextResponse.json({
      success: true,
      data: feedback,
      newCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}
