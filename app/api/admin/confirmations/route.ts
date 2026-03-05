import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const { authorized, response } = await requireAdmin();
  if (!authorized) return response;

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const filter = searchParams.get("filter") || "all";

    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const where: Record<string, unknown> = {};

    switch (filter) {
      case "due_soon":
        where.statusConfirmationDue = {
          gte: now,
          lte: twoDaysFromNow,
        };
        break;
      case "overdue":
        where.statusConfirmationDue = { lt: now };
        where.status = "ACTIVE";
        break;
      case "confirmed":
        where.lastStatusConfirmation = { gte: sevenDaysAgo };
        break;
      case "all":
      default:
        break;
    }

    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      prisma.businessListing.findMany({
        where,
        include: {
          listedBy: {
            select: { name: true, email: true },
          },
        },
        orderBy: { statusConfirmationDue: "asc" },
        skip,
        take: limit,
      }),
      prisma.businessListing.count({ where }),
    ]);

    const listingsWithStatus = listings.map((listing) => {
      let confirmationStatus: string;

      if (
        listing.lastStatusConfirmation &&
        listing.lastStatusConfirmation >= sevenDaysAgo
      ) {
        confirmationStatus = "confirmed";
      } else if (
        listing.statusConfirmationDue &&
        listing.statusConfirmationDue < now
      ) {
        confirmationStatus = "overdue";
      } else if (
        listing.statusConfirmationDue &&
        listing.statusConfirmationDue <= twoDaysFromNow
      ) {
        confirmationStatus = "due_soon";
      } else {
        confirmationStatus = "pending";
      }

      return { ...listing, confirmationStatus };
    });

    return NextResponse.json({
      success: true,
      data: listingsWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching confirmations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch confirmations" },
      { status: 500 }
    );
  }
}
