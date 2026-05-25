import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { applyAddressPrivacy } from "@/lib/address-privacy";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Try finding by slug first, then by ID
    const listing = await prisma.businessListing.findFirst({
      where: {
        OR: [{ slug: id }, { id: id }],
      },
      include: {
        photos: { orderBy: { order: "asc" } },
        listedBy: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
            role: true,
            brokerageName: true,
            brokeragePhone: true,
            phone: true,
            email: true,
          },
        },
        coBrokers: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
            brokerageName: true,
            phone: true,
          },
        },
        _count: { select: { inquiries: true, savedByUsers: true } },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    // Ghost listings require share token
    if (listing.isGhostListing) {
      const token = new URL(request.url).searchParams.get("token");
      if (token !== listing.shareToken) {
        return NextResponse.json(
          { success: false, error: "Listing not found" },
          { status: 404 }
        );
      }
    }

    // Apply address privacy — but skip for the listing owner
    const session = await auth();
    const isOwner = session?.user?.id === listing.listedById;
    const sanitizedListing = isOwner ? listing : applyAddressPrivacy(listing as any);

    return NextResponse.json({ success: true, data: sanitizedListing });
  } catch (error) {
    console.error("Error fetching listing:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const listing = await prisma.businessListing.findUnique({ where: { id } });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    // Only owner or admin can edit
    if (listing.listedById !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    // Separate photos out — they're handled via the nested relation, not a column.
    const { photos: photoUpdates, ...rest } = body;

    const annualRevenue = rest.annualRevenue ?? listing.annualRevenue;
    const netIncome = rest.netIncome ?? listing.netIncome;
    const cashFlowSDE = rest.cashFlowSDE ?? listing.cashFlowSDE;
    const askingPrice = rest.askingPrice ?? listing.askingPrice;

    const profitMargin =
      annualRevenue && netIncome
        ? Number(
            ((Number(netIncome) / Number(annualRevenue)) * 100).toFixed(2),
          )
        : listing.profitMargin;
    const askingMultiple =
      cashFlowSDE && Number(cashFlowSDE) > 0
        ? Number((Number(askingPrice) / Number(cashFlowSDE)).toFixed(2))
        : listing.askingMultiple;

    let slug = listing.slug;
    if (rest.title && rest.title !== listing.title) {
      slug = slugify(rest.title);
      const existingSlug = await prisma.businessListing.findFirst({
        where: { slug, id: { not: id } },
      });
      if (existingSlug) slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Replace the photo set when the caller sends a photos array.
    // This is a full overwrite — caller is responsible for sending the
    // complete final list.
    if (Array.isArray(photoUpdates)) {
      await prisma.photo.deleteMany({ where: { listingId: id } });
      if (photoUpdates.length > 0) {
        await prisma.photo.createMany({
          data: photoUpdates.map(
            (p: { url: string; order?: number }, idx: number) => ({
              listingId: id,
              url: p.url,
              order: typeof p.order === "number" ? p.order : idx,
            }),
          ),
        });
      }
    }

    const updated = await prisma.businessListing.update({
      where: { id },
      data: {
        ...rest,
        slug,
        profitMargin,
        askingMultiple,
      },
      include: { photos: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating listing:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update listing" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const listing = await prisma.businessListing.findUnique({ where: { id } });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    if (listing.listedById !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    await prisma.businessListing.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting listing:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete listing" },
      { status: 500 }
    );
  }
}
