import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";
import StatusConfirmationRequest from "@/emails/status-confirmation-request";

// POST: 7-day listing status confirmation emails
// Secured with CRON_SECRET header
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find listings that are due for confirmation
    // Either: statusConfirmationDue is in the past, or it's null and listing is > 7 days old
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const listings = await prisma.businessListing.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { statusConfirmationDue: { lt: now } },
          {
            statusConfirmationDue: null,
            createdAt: { lt: sevenDaysAgo },
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

    for (const listing of listings) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mercatolist.com";
        const secret = process.env.NEXTAUTH_SECRET || "";

        // Generate HMAC token for one-click confirm
        const token = crypto
          .createHmac("sha256", secret)
          .update(listing.id)
          .digest("hex");

        const confirmUrl = `${appUrl}/api/listings/${listing.id}/confirm?token=${token}`;
        const updateUrl = `${appUrl}/my-listings`;

        await sendEmail({
          to: listing.listedBy.email,
          subject: `Is "${listing.title}" still active? — MercatoList`,
          react: StatusConfirmationRequest({
            listingTitle: listing.title,
            listingCategory: listing.category,
            listingBorough: listing.borough.replace("_", " "),
            askingPrice: `$${Number(listing.askingPrice).toLocaleString()}`,
            confirmUrl,
            updateUrl,
            ownerName: listing.listedBy.name,
          }),
        });

        // Set next due date to 7 days from now
        const nextDue = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        await prisma.businessListing.update({
          where: { id: listing.id },
          data: { statusConfirmationDue: nextDue },
        });

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
