import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Invite a collaborator to a collection
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify collection ownership
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        collaborators: {
          select: { userId: true },
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 }
      );
    }

    if (collection.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Only the collection owner can invite collaborators" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    if (!role || !["editor", "viewer"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Role must be 'editor' or 'viewer'" },
        { status: 400 }
      );
    }

    // Check max 4 total (owner + 3 collaborators)
    if (collection.collaborators.length >= 3) {
      return NextResponse.json(
        { success: false, error: "Maximum of 3 collaborators allowed per collection" },
        { status: 400 }
      );
    }

    // Look up user by email
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No user found with that email address" },
        { status: 404 }
      );
    }

    // Cannot invite yourself
    if (user.id === session.user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot invite yourself" },
        { status: 400 }
      );
    }

    // Check if already a collaborator
    const alreadyCollaborator = collection.collaborators.some(
      (c) => c.userId === user.id
    );

    if (alreadyCollaborator) {
      return NextResponse.json(
        { success: false, error: "User is already a collaborator" },
        { status: 409 }
      );
    }

    // Create CollectionCollaborator record
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
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

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
      { status: 201 }
    );
  } catch (error) {
    console.error("Error inviting collaborator:", error);
    return NextResponse.json(
      { success: false, error: "Failed to invite collaborator" },
      { status: 500 }
    );
  }
}
