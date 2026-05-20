import { prisma } from "@/lib/prisma";

/**
 * Run after a user signs up (credentials or OAuth) to attach any pending
 * invites that were waiting on this email:
 *
 * 1. For every Client row whose email matches the new user's email,
 *    look up that client's CollectionClient assignments and create a
 *    CollectionCollaborator (editor) row for each collection so the
 *    client can immediately see and edit those collections.
 *
 * 2. (Future) Any other orphan-by-email invitations can be wired here.
 *
 * Idempotent — safe to call multiple times (uses upsert).
 */
export async function attachPendingInvites(userId: string, email: string) {
  const normalizedEmail = email.toLowerCase();

  try {
    const clients = await prisma.client.findMany({
      where: { email: normalizedEmail },
      include: {
        collectionAssignments: {
          select: { collectionId: true, addedById: true },
        },
      },
    });

    if (clients.length === 0) return;

    for (const client of clients) {
      for (const assignment of client.collectionAssignments) {
        // Skip if the broker is the new user (shouldn't happen but defensive).
        if (assignment.addedById === userId) continue;
        await prisma.collectionCollaborator.upsert({
          where: {
            collectionId_userId: {
              collectionId: assignment.collectionId,
              userId,
            },
          },
          update: {},
          create: {
            collectionId: assignment.collectionId,
            userId,
            role: "editor",
            invitedBy: assignment.addedById,
            acceptedAt: new Date(),
          },
        });
      }
    }
  } catch (error) {
    // Non-blocking: registration should still succeed even if attach fails.
    console.error("[attachPendingInvites] failed:", error);
  }
}
