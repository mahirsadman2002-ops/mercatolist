import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: mark all current notes in this collection as "read" for the current user.
// Updates the appropriate lastNotesReadAt (owner or collaborator).
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const collection = await prisma.collection.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!collection) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 },
      );
    }

    const now = new Date();
    if (collection.userId === session.user.id) {
      await prisma.collection.update({
        where: { id },
        data: { ownerLastNotesReadAt: now },
      });
    } else {
      // Try to update collaborator row. If they're not a collaborator, no-op
      // (they're either a public-link visitor or have no business here).
      await prisma.collectionCollaborator
        .update({
          where: {
            collectionId_userId: { collectionId: id, userId: session.user.id },
          },
          data: { lastNotesReadAt: now },
        })
        .catch(() => {
          // Silently ignore — visitor without collaborator row.
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark notes as read:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark notes as read" },
      { status: 500 },
    );
  }
}
