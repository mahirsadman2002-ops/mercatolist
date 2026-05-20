import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";

    const reviews = await prisma.review.findMany({
      where: {
        transactionStatus: status as "PENDING" | "APPROVED" | "REJECTED",
      },
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            displayName: true,
          },
        },
        broker: {
          select: {
            id: true,
            name: true,
            email: true,
            displayName: true,
            brokerageName: true,
          },
        },
        transactionReviewer: {
          select: { id: true, name: true, email: true },
        },
        linkedListing: {
          select: { id: true, slug: true, title: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: reviews.map((r) => ({
        ...r,
        transactionPrice: r.transactionPrice ? Number(r.transactionPrice) : null,
        createdAt: r.createdAt.toISOString(),
        responseAt: r.responseAt?.toISOString() || null,
        transactionReviewedAt:
          r.transactionReviewedAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch pending transactions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transactions" },
      { status: 500 },
    );
  }
}
