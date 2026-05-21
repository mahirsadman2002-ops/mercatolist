import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: returns per-user totals used to drive nav badges:
//   - unreadNotes: notes across all owned/collaborated collections created
//     after the user's lastNotesReadAt and not authored by them
//   - pendingRequests: pending CollectionAccessRequest rows on collections
//     the user owns
//   - perCollection: same data broken out by collectionId for /collections list
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    const [ownedCollections, collaborations, pendingRequestRows] =
      await Promise.all([
        prisma.collection.findMany({
          where: { userId },
          select: {
            id: true,
            ownerLastNotesReadAt: true,
          },
        }),
        prisma.collectionCollaborator.findMany({
          where: { userId },
          select: {
            collectionId: true,
            lastNotesReadAt: true,
          },
        }),
        prisma.collectionAccessRequest.findMany({
          where: {
            status: "PENDING",
            collection: { userId },
          },
          select: { collectionId: true },
        }),
      ]);

    type Stat = {
      unreadNotes: number;
      newListings: number;
      pendingRequests: number;
    };
    const perCollection: Record<string, Stat> = {};

    // Both unread notes AND new listings share the same "last viewed at"
    // timestamp — opening the collection page clears both. We track them
    // separately in the counts so the UI can show distinct badges.
    async function pull(
      collectionId: string,
      lastViewedAt: Date | null,
    ): Promise<void> {
      const [notes, listings] = await Promise.all([
        prisma.collectionNote.count({
          where: {
            collectionId,
            userId: { not: userId },
            ...(lastViewedAt ? { createdAt: { gt: lastViewedAt } } : {}),
          },
        }),
        prisma.collectionListing.count({
          where: {
            collectionId,
            addedBy: { not: userId },
            ...(lastViewedAt ? { addedAt: { gt: lastViewedAt } } : {}),
          },
        }),
      ]);
      perCollection[collectionId] = {
        unreadNotes: notes,
        newListings: listings,
        pendingRequests: 0,
      };
    }

    await Promise.all([
      ...ownedCollections.map((c) => pull(c.id, c.ownerLastNotesReadAt)),
      ...collaborations.map((c) =>
        pull(c.collectionId, c.lastNotesReadAt),
      ),
    ]);

    // Add pending request counts to per-collection totals
    for (const req of pendingRequestRows) {
      if (!perCollection[req.collectionId]) {
        perCollection[req.collectionId] = {
          unreadNotes: 0,
          newListings: 0,
          pendingRequests: 0,
        };
      }
      perCollection[req.collectionId].pendingRequests += 1;
    }

    const unreadNotes = Object.values(perCollection).reduce(
      (sum, c) => sum + c.unreadNotes,
      0,
    );
    const newListings = Object.values(perCollection).reduce(
      (sum, c) => sum + c.newListings,
      0,
    );
    const pendingRequests = pendingRequestRows.length;

    return NextResponse.json({
      success: true,
      data: {
        unreadNotes,
        newListings,
        pendingRequests,
        perCollection,
      },
    });
  } catch (error) {
    console.error("Failed to compute collection stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
