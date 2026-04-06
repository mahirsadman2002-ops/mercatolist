import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: View a publicly shared collection (no auth required)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const collection = await prisma.collection.findUnique({
      where: {
        shareToken: token,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
            role: true,
            brokerageName: true,
          },
        },
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

    if (!collection || !collection.isPubliclyShared) {
      return NextResponse.json(
        { success: false, error: "Collection not found or not publicly shared" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        owner: collection.user,
        listingCount: collection.collectionListings.length,
        collectionListings: collection.collectionListings.map((cl) => ({
          id: cl.id,
          personalRating: cl.personalRating,
          clientInterested: cl.clientInterested ?? null,
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
        notes: collection.notes.map((n) => ({
          id: n.id,
          content: n.content,
          listingId: n.listingId,
          user: n.user,
          createdAt: n.createdAt,
        })),
        createdAt: collection.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching shared collection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch shared collection" },
      { status: 500 }
    );
  }
}
