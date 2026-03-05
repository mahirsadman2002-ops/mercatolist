import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import ListingStatusChange from "@/emails/listing-status-change";

// POST: 24hr saved listing status change checks
// Checks all listings that were updated in the last 24 hours and notifies
// users who have saved those listings about status changes.
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find status logs created in the last 24 hours
    const recentStatusChanges = await prisma.listingStatusLog.findMany({
      where: {
        createdAt: { gte: twentyFourHoursAgo },
        previousStatus: { not: undefined },
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            askingPrice: true,
            category: true,
            neighborhood: true,
            borough: true,
            soldPrice: true,
            photos: {
              orderBy: { order: "asc" },
              take: 1,
            },
            savedByUsers: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    let emailsSent = 0;

    for (const change of recentStatusChanges) {
      const listing = change.listing;

      // Email each user who saved this listing
      for (const saved of listing.savedByUsers) {
        try {
          await sendEmail({
            to: saved.user.email,
            subject: `${listing.title} is now ${formatStatusLabel(change.confirmedStatus)}`,
            react: ListingStatusChange({
              userName: saved.user.name,
              listingTitle: listing.title,
              listingSlug: listing.slug,
              oldStatus: change.previousStatus,
              newStatus: change.confirmedStatus,
              askingPrice: listing.askingPrice.toString(),
              category: listing.category,
              neighborhood: listing.neighborhood,
              borough: listing.borough,
              photoUrl: listing.photos[0]?.url || null,
              soldPrice: listing.soldPrice?.toString() || null,
            }),
          });
          emailsSent++;
        } catch (err) {
          console.error(
            `Failed to send status alert to ${saved.user.email}:`,
            err
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: recentStatusChanges.length,
      emailsSent,
    });
  } catch (error) {
    console.error("Saved listing alerts cron error:", error);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}

function formatStatusLabel(status: string): string {
  switch (status) {
    case "ACTIVE": return "Active";
    case "UNDER_CONTRACT": return "Under Contract";
    case "SOLD": return "Sold";
    case "OFF_MARKET": return "Off Market";
    default: return status;
  }
}
