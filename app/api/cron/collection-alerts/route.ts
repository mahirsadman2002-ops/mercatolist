import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import CollectionUpdate from "@/emails/collection-update";

// POST: Collection listing status change alerts
// Checks listings in collections for status changes (via ListingStatusLog)
// and emails both the broker and the client.
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find status logs created in the last 24 hours for listings in collections
    const recentChanges = await prisma.listingStatusLog.findMany({
      where: {
        createdAt: { gte: twentyFourHoursAgo },
      },
      select: {
        previousStatus: true,
        confirmedStatus: true,
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            askingPrice: true,
            collections: {
              select: {
                id: true,
                name: true,
                userId: true,
                clientName: true,
                clientEmail: true,
                user: {
                  select: {
                    name: true,
                    displayName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Group changes by collection
    const collectionChanges = new Map<
      string,
      {
        collection: {
          id: string;
          name: string;
          clientName: string | null;
          clientEmail: string | null;
          brokerName: string;
          brokerEmail: string;
        };
        changes: {
          listingTitle: string;
          listingSlug: string;
          oldStatus: string;
          newStatus: string;
          askingPrice: string;
        }[];
      }
    >();

    for (const change of recentChanges) {
      for (const col of change.listing.collections) {
        if (!collectionChanges.has(col.id)) {
          collectionChanges.set(col.id, {
            collection: {
              id: col.id,
              name: col.name,
              clientName: col.clientName,
              clientEmail: col.clientEmail,
              brokerName: col.user.displayName || col.user.name,
              brokerEmail: col.user.email,
            },
            changes: [],
          });
        }
        collectionChanges.get(col.id)!.changes.push({
          listingTitle: change.listing.title,
          listingSlug: change.listing.slug,
          oldStatus: change.previousStatus,
          newStatus: change.confirmedStatus,
          askingPrice: change.listing.askingPrice.toString(),
        });
      }
    }

    let emailsSent = 0;

    for (const [, entry] of collectionChanges) {
      const { collection, changes } = entry;

      // Email the broker (collection owner)
      try {
        await sendEmail({
          to: collection.brokerEmail,
          subject: `${changes.length} listing${changes.length !== 1 ? "s" : ""} updated in "${collection.name}"`,
          react: CollectionUpdate({
            recipientName: collection.brokerName,
            collectionName: collection.name,
            collectionId: collection.id,
            changes,
          }),
        });
        emailsSent++;
      } catch (err) {
        console.error(
          `Failed to send collection alert to broker ${collection.brokerEmail}:`,
          err
        );
      }

      // Email the client if one is assigned
      if (collection.clientEmail && collection.clientName) {
        try {
          await sendEmail({
            to: collection.clientEmail,
            subject: `${changes.length} listing${changes.length !== 1 ? "s" : ""} updated in "${collection.name}"`,
            react: CollectionUpdate({
              recipientName: collection.clientName,
              collectionName: collection.name,
              collectionId: collection.id,
              brokerName: collection.brokerName,
              changes,
            }),
          });
          emailsSent++;
        } catch (err) {
          console.error(
            `Failed to send collection alert to client ${collection.clientEmail}:`,
            err
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: collectionChanges.size,
      emailsSent,
    });
  } catch (error) {
    console.error("Collection alerts cron error:", error);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
