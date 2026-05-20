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

    const perCollection: Record<
      string,
      { unreadNotes: number; pendingRequests: number }
    > = {};

    // Count unread notes for owned collections
    await Promise.all(
      ownedCollections.map(async (c) => {
        const count = await prisma.collectionNote.count({
          where: {
            collectionId: c.id,
            userId: { not: userId },
            ...(c.ownerLastNotesReadAt
              ? { createdAt: { gt: c.ownerLastNotesReadAt } }
              : {}),
          },
        });
        perCollection[c.id] = {
          unreadNotes: count,
          pendingRequests: 0,
        };
      }),
    );

    // Count unread notes for collaborated collections
    await Promise.all(
      collaborations.map(async (c) => {
        const count = await prisma.collectionNote.count({
          where: {
            collectionId: c.collectionId,
            userId: { not: userId },
            ...(c.lastNotesReadAt
              ? { createdAt: { gt: c.lastNotesReadAt } }
              : {}),
          },
        });
        perCollection[c.collectionId] = {
          unreadNotes: count,
          pendingRequests: 0,
        };
      }),
    );

    // Add pending request counts to per-collection totals
    for (const req of pendingRequestRows) {
      if (!perCollection[req.collectionId]) {
        perCollection[req.collectionId] = { unreadNotes: 0, pendingRequests: 0 };
      }
      perCollection[req.collectionId].pendingRequests += 1;
    }

    const unreadNotes = Object.values(perCollection).reduce(
      (sum, c) => sum + c.unreadNotes,
      0,
    );
    const pendingRequests = pendingRequestRows.length;

    return NextResponse.json({
      success: true,
      data: {
        unreadNotes,
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
