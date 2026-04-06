import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Get a single collection with all listings, collaborators, notes, client
export async function GET(
  _request: NextRequest,
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

    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        client: true,
        collectionListings: {
          orderBy: { addedAt: "desc" },
          include: {
            listing: {
              include: {
                photos: {
                  orderBy: { order: "asc" },
                },
                listedBy: {
                  select: {
                    id: true,
                    name: true,
                    displayName: true,
                    avatarUrl: true,
                    phone: true,
                    role: true,
                    brokerageName: true,
                  },
                },
              },
            },
          },
        },
        collaborators: {
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
        },
        notes: {
          orderBy: { createdAt: "desc" },
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
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 }
      );
    }

    // Check: user must be owner, collaborator, or assigned client
    const isOwner = collection.userId === session.user.id;
    const isCollaborator = collection.collaborators.some(
      (c) => c.userId === session.user.id
    );

    // Check if user is an assigned client
    let isAssignedClient = false;
    if (!isOwner && !isCollaborator && collection.clientId) {
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true },
      });
      if (currentUser?.email) {
        const clientRecord = await prisma.client.findUnique({
          where: { id: collection.clientId },
          select: { email: true },
        });
        if (clientRecord && clientRecord.email.toLowerCase() === currentUser.email.toLowerCase()) {
          isAssignedClient = true;
        }
      }
    }

    if (!isOwner && !isCollaborator && !isAssignedClient) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get advisor name for assigned clients
    let advisorName: string | null = null;
    if (isAssignedClient) {
      const advisor = await prisma.user.findUnique({
        where: { id: collection.userId },
        select: { name: true, displayName: true },
      });
      advisorName = advisor?.displayName || advisor?.name || null;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        shareToken: collection.shareToken,
        isPubliclyShared: collection.isPubliclyShared,
        userId: collection.userId,
        client: collection.client,
        listingCount: collection.collectionListings.length,
        collectionListings: collection.collectionListings.map((cl) => ({
          id: cl.id,
          personalRating: cl.personalRating,
          clientInterested: cl.clientInterested,
          addedBy: cl.addedBy,
          addedAt: cl.addedAt,
          listing: {
            id: cl.listing.id,
            slug: cl.listing.slug,
            title: cl.listing.title,
            description: cl.listing.description,
            category: cl.listing.category,
            status: cl.listing.status,
            askingPrice: cl.listing.askingPrice,
            annualRevenue: cl.listing.annualRevenue,
            cashFlowSDE: cl.listing.cashFlowSDE,
            neighborhood: cl.listing.neighborhood,
            borough: cl.listing.borough,
            address: cl.listing.hideAddress ? null : cl.listing.address,
            photos: cl.listing.photos,
            listedBy: cl.listing.listedBy,
            yearEstablished: cl.listing.yearEstablished,
            numberOfEmployees: cl.listing.numberOfEmployees,
            squareFootage: cl.listing.squareFootage,
            createdAt: cl.listing.createdAt,
          },
        })),
        collaborators: collection.collaborators.map((c) => ({
          id: c.id,
          role: c.role,
          user: c.user,
          joinedAt: c.invitedAt,
        })),
        notes: collection.notes.map((n) => ({
          id: n.id,
          content: n.content,
          listingId: n.listingId,
          user: n.user,
          createdAt: n.createdAt,
        })),
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
        isAssignedClient,
        advisorName,
      },
    });
  } catch (error) {
    console.error("Error fetching collection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch collection" },
      { status: 500 }
    );
  }
}

// PUT: Update collection name, description, clientId
export async function PUT(
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

    const existing = await prisma.collection.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, clientId } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Collection name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (clientId !== undefined) {
      if (clientId) {
        const client = await prisma.client.findUnique({
          where: { id: clientId },
        });
        if (!client) {
          return NextResponse.json(
            { success: false, error: "Client not found" },
            { status: 404 }
          );
        }
      }
      updateData.clientId = clientId || null;
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        _count: {
          select: { collectionListings: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        clientId: collection.clientId,
        client: collection.client,
        listingCount: collection._count.collectionListings,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating collection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update collection" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a collection
export async function DELETE(
  _request: NextRequest,
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

    const existing = await prisma.collection.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    await prisma.collection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete collection" },
      { status: 500 }
    );
  }
}
