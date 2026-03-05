import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import MarketingNudge from "@/emails/marketing-nudge";

// POST: Weekly marketing nudge emails for users with saved listings
// Sends a "still interested?" email with stats about their saved listings.
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find users who have active saved listings
    const usersWithSaves = await prisma.user.findMany({
      where: {
        savedListings: {
          some: {
            listing: {
              status: "ACTIVE",
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        savedListings: {
          where: {
            listing: {
              status: "ACTIVE",
            },
          },
          select: {
            listing: {
              select: {
                id: true,
                title: true,
                slug: true,
                askingPrice: true,
                category: true,
                neighborhood: true,
                borough: true,
                viewCount: true,
                saveCount: true,
                createdAt: true,
                photos: {
                  orderBy: { order: "asc" },
                  take: 1,
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 4,
        },
        _count: {
          select: {
            savedListings: true,
          },
        },
      },
    });

    let emailsSent = 0;

    for (const user of usersWithSaves) {
      const totalSaved = user._count.savedListings;
      if (totalSaved === 0) continue;

      const now = new Date();

      try {
        await sendEmail({
          to: user.email,
          subject: `Still interested? Check your ${totalSaved} saved listing${totalSaved !== 1 ? "s" : ""}`,
          react: MarketingNudge({
            name: user.name,
            savedCount: totalSaved,
            listings: user.savedListings.map((s) => ({
              title: s.listing.title,
              slug: s.listing.slug,
              askingPrice: s.listing.askingPrice.toString(),
              category: s.listing.category,
              neighborhood: s.listing.neighborhood,
              borough: s.listing.borough,
              photoUrl: s.listing.photos[0]?.url || null,
              viewCount: s.listing.viewCount,
              saveCount: s.listing.saveCount,
              daysOnMarket: Math.ceil(
                (now.getTime() - s.listing.createdAt.getTime()) /
                  (1000 * 60 * 60 * 24)
              ),
            })),
            dashboardUrl: "https://mercatolist.com/saved",
          }),
        });
        emailsSent++;
      } catch (err) {
        console.error(
          `Failed to send marketing nudge to ${user.email}:`,
          err
        );
      }
    }

    return NextResponse.json({
      success: true,
      processed: usersWithSaves.length,
      emailsSent,
    });
  } catch (error) {
    console.error("Marketing nudge cron error:", error);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
