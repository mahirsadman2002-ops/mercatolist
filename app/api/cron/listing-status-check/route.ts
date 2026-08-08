import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import {
  sendStatusConfirmationEmail,
  CONFIRMATION_INTERVAL_DAYS,
} from "@/lib/listing-confirmation";

// POST: 30-day listing status confirmation emails (one per listing)
// Secured with CRON_SECRET header
async function handler(request: Request) {
  const denied = requireCron(request);
  if (denied) return denied;

  try {
    const now = new Date();

    // Find listings that are due for confirmation.
    // Either: statusConfirmationDue is in the past, or it's null and the listing
    // is older than one confirmation interval (so brand-new listings get a grace period).
    const intervalAgo = new Date(
      now.getTime() - CONFIRMATION_INTERVAL_DAYS * 24 * 60 * 60 * 1000
    );

    const listings = await prisma.businessListing.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { statusConfirmationDue: { lt: now } },
          {
            statusConfirmationDue: null,
            createdAt: { lt: intervalAgo },
          },
        ],
      },
      include: {
        listedBy: {
          select: { name: true, email: true },
        },
      },
      take: 50, // Process in batches
    });

    let processed = 0;
    let errors = 0;

    // Each listing gets its own individual email, even if one owner has several.
    for (const listing of listings) {
      try {
        await sendStatusConfirmationEmail(listing);
        processed++;
      } catch (error) {
        console.error(`Failed to process listing ${listing.id}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      errors,
      total: listings.length,
    });
  } catch (error) {
    console.error("Listing status check cron error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Vercel Cron invokes with GET; POST kept for manual triggering
export { handler as GET, handler as POST };
