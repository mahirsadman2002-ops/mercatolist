import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: per-user totals driving the nav/list badges:
//   - unreadNotes / newListings: per-collection counts of new activity
//     since the user last viewed each collection, excluding their own
//     contributions.
//   - pendingRequests: PENDING CollectionAccessRequest rows on collections
//     the user owns.
//
// Implementation note: this used to do 2 count queries per collection. For
// a user with N collections that meant 2N round-trips. We now do a fixed
// 4 round-trips total (lookup + 3 fanout pulls), filtering and grouping
// the results in JS. Way easier on Neon when polled every 30s.
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

    // 1 + 2 + 3. Look up everything we need to compute per-collection state.
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

    // Build a per-collection "last viewed at" map. Owner timestamp wins if
    // the user is both an owner and (somehow) a collaborator, but in
    // practice these sets are disjoint.
    const lastViewedAt = new Map<string, Date | null>();
    for (const c of collaborations) {
      lastViewedAt.set(c.collectionId, c.lastNotesReadAt);
    }
    for (const c of ownedCollections) {
      lastViewedAt.set(c.id, c.ownerLastNotesReadAt);
    }

    const collectionIds = Array.from(lastViewedAt.keys());

    type Stat = {
      unreadNotes: number;
      newListings: number;
      pendingRequests: number;
    };
    const perCollection: Record<string, Stat> = {};
    for (const id of collectionIds) {
      perCollection[id] = {
        unreadNotes: 0,
        newListings: 0,
        pendingRequests: 0,
      };
    }

    // 4. Pull every relevant note/listing in two single queries. We filter
    // by per-collection lastViewedAt in JS afterwards — the alternative is
    // a UNION of N WHERE clauses, which Prisma can't express cleanly.
    // Selecting only the timestamps keeps the payload tiny.
    if (collectionIds.length > 0) {
      const [allNotes, allListings] = await Promise.all([
        prisma.collectionNote.findMany({
          where: {
            collectionId: { in: collectionIds },
            userId: { not: userId },
          },
          select: { collectionId: true, createdAt: true },
        }),
        prisma.collectionListing.findMany({
          where: {
            collectionId: { in: collectionIds },
            addedBy: { not: userId },
          },
          select: { collectionId: true, addedAt: true },
        }),
      ]);

      for (const note of allNotes) {
        const cutoff = lastViewedAt.get(note.collectionId);
        if (!cutoff || note.createdAt > cutoff) {
          perCollection[note.collectionId].unreadNotes += 1;
        }
      }
      for (const listing of allListings) {
        const cutoff = lastViewedAt.get(listing.collectionId);
        if (!cutoff || listing.addedAt > cutoff) {
          perCollection[listing.collectionId].newListings += 1;
        }
      }
    }

    // Pending requests on owned collections.
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
