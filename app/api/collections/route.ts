import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: List all collections for the current user (owned + collaborator + assigned via client)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user email for client-assigned collection lookup
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const collections = await prisma.collection.findMany({
      where: {
        OR: [
          { userId },
          { collaborators: { some: { userId } } },
        ],
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        collectionListings: {
          take: 4,
          orderBy: { addedAt: "desc" },
          include: {
            listing: {
              include: {
                photos: {
                  orderBy: { order: "asc" },
                  take: 1,
                },
              },
            },
          },
        },
        _count: {
          select: {
            collectionListings: true,
            collaborators: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const ownedCollectionIds = new Set(collections.map((c) => c.id));

    const data = collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      shareToken: collection.shareToken,
      isPubliclyShared: collection.isPubliclyShared,
      clientId: collection.clientId,
      client: collection.client,
      listingCount: collection._count.collectionListings,
      previewPhotos: collection.collectionListings
        .flatMap((cl) => cl.listing.photos)
        .slice(0, 4)
        .map((photo) => ({ id: photo.id, url: photo.url })),
      collaboratorCount: collection._count.collaborators,
      createdAt: collection.createdAt,
      isSharedWithMe: false,
      advisorName: null as string | null,
    }));

    // Also fetch collections assigned to this user via Client records
    if (currentUser?.email) {
      const clientRecords = await prisma.client.findMany({
        where: { email: currentUser.email.toLowerCase() },
        select: { id: true, advisorId: true },
      });

      if (clientRecords.length > 0) {
        const clientIds = clientRecords.map((c) => c.id);

        const assignedCollections = await prisma.collection.findMany({
          where: {
            clientId: { in: clientIds },
            id: { notIn: Array.from(ownedCollectionIds) },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
            collectionListings: {
              take: 4,
              orderBy: { addedAt: "desc" },
              include: {
                listing: {
                  include: {
                    photos: {
                      orderBy: { order: "asc" },
                      take: 1,
                    },
                  },
                },
              },
            },
            _count: {
              select: {
                collectionListings: true,
                collaborators: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        });

        for (const col of assignedCollections) {
          data.push({
            id: col.id,
            name: col.name,
            description: col.description,
            shareToken: col.shareToken,
            isPubliclyShared: col.isPubliclyShared,
            clientId: col.clientId,
            client: null,
            listingCount: col._count.collectionListings,
            previewPhotos: col.collectionListings
              .flatMap((cl) => cl.listing.photos)
              .slice(0, 4)
              .map((photo) => ({ id: photo.id, url: photo.url })),
            collaboratorCount: col._count.collaborators,
            createdAt: col.createdAt,
            isSharedWithMe: true,
            advisorName: col.user.displayName || col.user.name,
          });
        }
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}

// POST: Create a new collection
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, clientId } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Collection name is required" },
        { status: 400 }
      );
    }

    // Validate clientId if provided
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

    const collection = await prisma.collection.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId: session.user.id,
        clientId: clientId || null,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: { collectionListings: true },
        },
      },
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create collection" },
      { status: 500 }
    );
  }
}
