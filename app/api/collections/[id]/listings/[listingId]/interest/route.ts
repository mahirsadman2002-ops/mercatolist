import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT: Mark client interest on a listing in a collection
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; listingId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, listingId } = await params;

    const collection = await prisma.collection.findUnique({
      where: { id },
      select: {
        userId: true,
        client: { select: { email: true } },
        clientAssignments: { select: { client: { select: { email: true } } } },
        collaborators: { where: { userId: session.user.id }, select: { id: true } },
      },
    });

    if (!collection) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 }
      );
    }

    // "Client interest" belongs to the people the collection was put together
    // for: a client the advisor assigned it to (clients are matched to accounts
    // by email) or someone the owner invited as a collaborator. The advisor who
    // owns it can't set it on the client's behalf.
    // Email matching only counts for a verified address (read fresh from the
    // database — anyone can sign up with someone else's email).
    const viewer = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, emailVerified: true },
    });
    const viewerEmail = viewer?.emailVerified
      ? viewer.email.trim().toLowerCase()
      : undefined;
    const clientEmails = [
      collection.client?.email,
      ...collection.clientAssignments.map((a) => a.client.email),
    ]
      .filter((e): e is string => !!e)
      .map((e) => e.trim().toLowerCase());
    const isAssignedClient = !!viewerEmail && clientEmails.includes(viewerEmail);
    const isCollaborator = collection.collaborators.length > 0;

    if (!isAssignedClient && !isCollaborator) {
      return NextResponse.json(
        {
          success: false,
          error:
            collection.userId === session.user.id
              ? "Only your client can mark interest on this collection"
              : "Only the assigned client can mark interest",
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const interested = body?.interested;

    // true = interested, false = not interested, null = clear the choice.
    if (typeof interested !== "boolean" && interested !== null) {
      return NextResponse.json(
        { success: false, error: "interested must be true, false or null" },
        { status: 400 }
      );
    }

    // Find the CollectionListing
    const collectionListing = await prisma.collectionListing.findUnique({
      where: {
        collectionId_listingId: {
          collectionId: id,
          listingId,
        },
      },
    });

    if (!collectionListing) {
      return NextResponse.json(
        { success: false, error: "Listing is not in this collection" },
        { status: 404 }
      );
    }

    const updated = await prisma.collectionListing.update({
      where: { id: collectionListing.id },
      data: {
        clientInterested: interested,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        listingId: updated.listingId,
        clientInterested: updated.clientInterested,
      },
    });
  } catch (error) {
    console.error("Error updating client interest:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update client interest" },
      { status: 500 }
    );
  }
}
