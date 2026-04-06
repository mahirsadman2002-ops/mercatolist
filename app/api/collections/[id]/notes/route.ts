import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch notes for a collection, optionally filtered by listingId
export async function GET(
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
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");

    // Verify collection access (owner or collaborator)
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

    const isOwner = collection.userId === session.user.id;
    const isCollaborator = collection.collaborators.some(
      (c) => c.userId === session.user.id
    );

    if (!isOwner && !isCollaborator) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const where: Record<string, unknown> = { collectionId: id };
    if (listingId) {
      where.listingId = listingId;
    }

    const notes = await prisma.collectionNote.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: notes.map((note) => ({
        id: note.id,
        content: note.content,
        listingId: note.listingId,
        user: note.user,
        createdAt: note.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

// POST: Add a note to a collection
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

    // Verify collection access (owner or collaborator)
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

    const isOwner = collection.userId === session.user.id;
    const isCollaborator = collection.collaborators.some(
      (c) => c.userId === session.user.id
    );

    if (!isOwner && !isCollaborator) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    let { content, listingId } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { success: false, error: "Content is required" },
        { status: 400 }
      );
    }

    // Strip HTML tags and trim
    content = content.replace(/<[^>]*>/g, "").trim();

    if (content.length === 0) {
      return NextResponse.json(
        { success: false, error: "Content cannot be empty" },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, error: "Content must be 1000 characters or fewer" },
        { status: 400 }
      );
    }

    // If listingId provided, verify it's in the collection
    if (listingId) {
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
    }

    const note = await prisma.collectionNote.create({
      data: {
        content,
        collectionId: id,
        userId: session.user.id,
        listingId: listingId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: note.id,
          content: note.content,
          listingId: note.listingId,
          user: note.user,
          createdAt: note.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create note" },
      { status: 500 }
    );
  }
}
