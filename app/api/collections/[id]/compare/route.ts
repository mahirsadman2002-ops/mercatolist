import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Compare listings in a collection
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
    const { listingIds } = body;

    if (!Array.isArray(listingIds) || listingIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "listingIds must be a non-empty array" },
        { status: 400 }
      );
    }

    if (listingIds.length > 4) {
      return NextResponse.json(
        { success: false, error: "Maximum of 4 listings can be compared at once" },
        { status: 400 }
      );
    }

    // Verify all listings are in this collection
    const collectionListings = await prisma.collectionListing.findMany({
      where: {
        collectionId: id,
        listingId: { in: listingIds },
      },
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
    });

    if (collectionListings.length !== listingIds.length) {
      return NextResponse.json(
        { success: false, error: "One or more listings are not in this collection" },
        { status: 400 }
      );
    }

    const data = collectionListings.map((cl) => ({
      collectionListingId: cl.id,
      personalRating: cl.personalRating,
      clientInterested: cl.clientInterested,
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
        netIncome: cl.listing.netIncome,
        profitMargin: cl.listing.profitMargin,
        askingMultiple: cl.listing.askingMultiple,
        monthlyRent: cl.listing.monthlyRent,
        annualPayroll: cl.listing.annualPayroll,
        totalExpenses: cl.listing.totalExpenses,
        inventoryValue: cl.listing.inventoryValue,
        inventoryIncluded: cl.listing.inventoryIncluded,
        ffeValue: cl.listing.ffeValue,
        ffeIncluded: cl.listing.ffeIncluded,
        sellerFinancing: cl.listing.sellerFinancing,
        sbaFinancingAvailable: cl.listing.sbaFinancingAvailable,
        yearEstablished: cl.listing.yearEstablished,
        numberOfEmployees: cl.listing.numberOfEmployees,
        ownerInvolvement: cl.listing.ownerInvolvement,
        ownerHoursPerWeek: cl.listing.ownerHoursPerWeek,
        squareFootage: cl.listing.squareFootage,
        leaseTerms: cl.listing.leaseTerms,
        leaseRenewalOption: cl.listing.leaseRenewalOption,
        reasonForSelling: cl.listing.reasonForSelling,
        neighborhood: cl.listing.neighborhood,
        borough: cl.listing.borough,
        address: cl.listing.hideAddress ? null : cl.listing.address,
        photos: cl.listing.photos,
        listedBy: cl.listing.listedBy,
        createdAt: cl.listing.createdAt,
      },
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error comparing listings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to compare listings" },
      { status: 500 }
    );
  }
}
