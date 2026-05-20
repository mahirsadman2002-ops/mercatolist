import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import ClientInvite from "@/emails/client-invite";

// Helper: confirm broker owns the collection AND the client.
async function authorize(
  collectionId: string,
  clientId: string,
  sessionUserId: string,
) {
  const [collection, client] = await Promise.all([
    prisma.collection.findUnique({
      where: { id: collectionId },
      select: { id: true, userId: true, name: true },
    }),
    prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, advisorId: true, email: true, name: true },
    }),
  ]);
  if (!collection || !client) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      ),
    };
  }
  if (
    collection.userId !== sessionUserId ||
    client.advisorId !== sessionUserId
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, collection, client };
}

// POST: assign a client to a collection.
// If the client's email matches an existing User, also create a CollectionCollaborator
// with editor role. If no matching User, optionally send a sign-up invite.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; clientId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const { id, clientId } = await params;
    const check = await authorize(id, clientId, session.user.id);
    if (!check.ok) return check.response;

    // Idempotent assign
    const assignment = await prisma.collectionClient.upsert({
      where: {
        collectionId_clientId: { collectionId: id, clientId },
      },
      update: {},
      create: {
        collectionId: id,
        clientId,
        addedById: session.user.id,
      },
    });

    // If the client has a MercatoList account, auto-link them as editor.
    const matchingUser = await prisma.user.findUnique({
      where: { email: check.client.email.toLowerCase() },
      select: { id: true },
    });

    let inviteSent = false;
    let collaboratorCreated = false;

    if (matchingUser && matchingUser.id !== session.user.id) {
      await prisma.collectionCollaborator.upsert({
        where: {
          collectionId_userId: {
            collectionId: id,
            userId: matchingUser.id,
          },
        },
        update: {},
        create: {
          collectionId: id,
          userId: matchingUser.id,
          role: "editor",
          invitedBy: session.user.id,
          acceptedAt: new Date(),
        },
      });
      collaboratorCreated = true;
    } else {
      // No account — send sign-up invite so they can join and see the collection.
      const broker = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, displayName: true, brokerageName: true },
      });
      const baseUrl =
        process.env.NEXTAUTH_URL || "https://mercatolist.com";
      const joinUrl = `${baseUrl}/signup-prompt?action=collection-access&collectionId=${id}&email=${encodeURIComponent(
        check.client.email,
      )}&callbackUrl=${encodeURIComponent(`/collections/${id}`)}`;
      try {
        await sendEmail({
          to: check.client.email,
          subject: `${broker?.displayName || broker?.name} shared a MercatoList collection with you`,
          react: ClientInvite({
            advisorName:
              broker?.displayName || broker?.name || "Your advisor",
            advisorCompany: broker?.brokerageName || undefined,
            joinUrl,
          }),
        });
        await prisma.client.update({
          where: { id: clientId },
          data: { invitedToPlatformAt: new Date() },
        });
        inviteSent = true;
      } catch (emailError) {
        console.error("Failed to send client invite email:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        assignment,
        collaboratorCreated,
        inviteSent,
        message: collaboratorCreated
          ? "Client added — they have an account so they can collaborate now."
          : inviteSent
            ? "Client added. We've emailed them a link to join MercatoList so they can see this collection."
            : "Client added.",
      },
    });
  } catch (error) {
    console.error("Failed to assign client:", error);
    return NextResponse.json(
      { success: false, error: "Failed to assign client" },
      { status: 500 },
    );
  }
}

// DELETE: unassign a client from a collection.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; clientId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const { id, clientId } = await params;
    const check = await authorize(id, clientId, session.user.id);
    if (!check.ok) return check.response;

    await prisma.collectionClient.delete({
      where: { collectionId_clientId: { collectionId: id, clientId } },
    });

    // Also remove the auto-linked collaborator if any (only if email-matched).
    const matchingUser = await prisma.user.findUnique({
      where: { email: check.client.email.toLowerCase() },
      select: { id: true },
    });
    if (matchingUser) {
      await prisma.collectionCollaborator
        .delete({
          where: {
            collectionId_userId: {
              collectionId: id,
              userId: matchingUser.id,
            },
          },
        })
        .catch(() => {
          // Ignore if collaborator wasn't auto-linked or was already removed manually.
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to unassign client:", error);
    return NextResponse.json(
      { success: false, error: "Failed to unassign client" },
      { status: 500 },
    );
  }
}
