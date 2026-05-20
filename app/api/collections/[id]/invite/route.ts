import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import CollectionInvite from "@/emails/collection-invite";
import ClientInvite from "@/emails/client-invite";

// POST: Invite a collaborator to a collection.
// Owner or editor can invite. If the invitee doesn't have a MercatoList
// account, we send them a sign-up invite so they can accept later.
export async function POST(
  request: NextRequest,
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
      include: {
        user: { select: { id: true, name: true, displayName: true } },
        collaborators: { select: { userId: true, role: true } },
        collectionListings: {
          orderBy: { addedAt: "desc" },
          include: {
            listing: {
              select: {
                title: true,
                neighborhood: true,
                category: true,
                photos: {
                  orderBy: { order: "asc" },
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 },
      );
    }

    const isOwner = collection.userId === session.user.id;
    const editorCollab = collection.collaborators.find(
      (c) => c.userId === session.user.id && c.role === "editor",
    );
    if (!isOwner && !editorCollab) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only the collection owner or editors can invite collaborators",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 },
      );
    }
    if (!role || !["editor", "viewer"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Role must be 'editor' or 'viewer'" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, displayName: true, email: true },
    });

    const inviterName =
      collection.user.displayName || collection.user.name || "A MercatoList user";

    const baseUrl =
      process.env.NEXTAUTH_URL || "https://mercatolist.com";

    // Build listing previews for the email — up to 3 listings shown as teasers.
    const previewListings = collection.collectionListings.slice(0, 3).map(
      (cl) => ({
        title: cl.listing.title,
        photoUrl: cl.listing.photos[0]?.url || null,
        neighborhood: cl.listing.neighborhood,
        category: cl.listing.category,
      }),
    );
    const totalListings = collection.collectionListings.length;

    // User doesn't exist — send a sign-up invite so they can register and
    // be granted access on signup (via the registration hook).
    if (!user) {
      const joinUrl = `${baseUrl}/signup-prompt?action=collection-access&collectionId=${id}&email=${encodeURIComponent(
        normalizedEmail,
      )}&callbackUrl=${encodeURIComponent(`/collections/${id}`)}`;

      try {
        await sendEmail({
          to: normalizedEmail,
          subject: `${inviterName} invited you to collaborate on MercatoList`,
          react: ClientInvite({
            advisorName: inviterName,
            joinUrl,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send signup invite email:", emailError);
      }

      return NextResponse.json({
        success: true,
        data: {
          status: "invite-sent",
          email: normalizedEmail,
          message:
            "We've sent them a link to join MercatoList. They'll be added once they sign up.",
        },
      });
    }

    if (user.id === session.user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot invite yourself" },
        { status: 400 },
      );
    }

    const alreadyCollaborator = collection.collaborators.some(
      (c) => c.userId === user.id,
    );
    if (alreadyCollaborator) {
      return NextResponse.json(
        { success: false, error: "User is already a collaborator" },
        { status: 409 },
      );
    }

    const collaborator = await prisma.collectionCollaborator.create({
      data: {
        collectionId: id,
        userId: user.id,
        role,
        invitedBy: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Notify the new collaborator
    try {
      await sendEmail({
        to: user.email,
        subject: `${inviterName} invited you to "${collection.name}" on MercatoList`,
        react: CollectionInvite({
          inviterName,
          collectionName: collection.name,
          role,
          joinUrl: `${baseUrl}/collections/${id}`,
          listings: previewListings,
          totalListings,
        }),
      });
    } catch (emailError) {
      console.error("Failed to send collaborator invite email:", emailError);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: collaborator.id,
          role: collaborator.role,
          user: collaborator.user,
          joinedAt: collaborator.invitedAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error inviting collaborator:", error);
    return NextResponse.json(
      { success: false, error: "Failed to invite collaborator" },
      { status: 500 },
    );
  }
}
