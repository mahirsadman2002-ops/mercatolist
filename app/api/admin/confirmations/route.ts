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
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const where: Record<string, unknown> = {};

    switch (filter) {
      case "due_soon":
        where.statusConfirmationDue = {
          gte: now,
          lte: threeDaysFromNow,
        };
        break;
      case "overdue":
        where.statusConfirmationDue = { lt: now };
        where.status = "ACTIVE";
        break;
      case "stale":
        // Non-responders: overdue AND we've already sent at least 2 reminders
        // with no confirmation back.
        where.statusConfirmationDue = { lt: now };
        where.status = "ACTIVE";
        where.confirmationRemindersSent = { gte: 2 };
        break;
      case "confirmed":
        where.lastStatusConfirmation = { gte: thirtyDaysAgo };
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

    const DAY_MS = 24 * 60 * 60 * 1000;

    const listingsWithStatus = listings.map((listing) => {
      let confirmationStatus: string;

      const isOverdue =
        listing.statusConfirmationDue && listing.statusConfirmationDue < now;

      if (
        listing.lastStatusConfirmation &&
        listing.lastStatusConfirmation >= thirtyDaysAgo
      ) {
        confirmationStatus = "confirmed";
      } else if (isOverdue && (listing.confirmationRemindersSent ?? 0) >= 2) {
        confirmationStatus = "stale";
      } else if (isOverdue) {
        confirmationStatus = "overdue";
      } else if (
        listing.statusConfirmationDue &&
        listing.statusConfirmationDue <= threeDaysFromNow
      ) {
        confirmationStatus = "due_soon";
      } else if (!listing.lastStatusConfirmation) {
        confirmationStatus = "never_confirmed";
      } else {
        confirmationStatus = "pending";
      }

      const daysSinceConfirmation = listing.lastStatusConfirmation
        ? Math.floor((now.getTime() - listing.lastStatusConfirmation.getTime()) / DAY_MS)
        : null;

      return { ...listing, confirmationStatus, daysSinceConfirmation };
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
