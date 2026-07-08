import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { applyAddressPrivacy } from "@/lib/address-privacy";
import { listingDraftSchema } from "@/lib/validations";

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

    // Ghost listings require a share token. A missing/blank shareToken must
    // NEVER be matchable by a tokenless request (null !== null would pass).
    if (listing.isGhostListing) {
      const token = new URL(request.url).searchParams.get("token");
      if (!listing.shareToken || token !== listing.shareToken) {
        return NextResponse.json(
          { success: false, error: "Listing not found" },
          { status: 404 }
        );
      }
    }

    // Apply address privacy — but skip for the listing owner / admins.
    const session = await auth();
    const isOwner = session?.user?.id === listing.listedById;
    const isPrivileged = isOwner || session?.user?.role === "ADMIN";

    // DRAFT / OFF_MARKET listings are private to the owner (and admins). Anyone
    // else gets a 404 — indistinguishable from "doesn't exist" so we don't
    // leak that a private listing is here.
    const PUBLIC_STATUSES = ["ACTIVE", "UNDER_CONTRACT", "SOLD"];
    if (!isPrivileged && !PUBLIC_STATUSES.includes(listing.status)) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    let sanitizedListing: typeof listing = listing;
    if (!isPrivileged) {
      sanitizedListing = applyAddressPrivacy(listing as any);

      // Never expose seller/broker email publicly — contact happens through
      // the inquiry system. Only expose phone numbers when the lister opted in
      // via showPhoneNumber. This prevents scraping seller PII at scale.
      if (sanitizedListing.listedBy) {
        sanitizedListing.listedBy.email = "";
        if (!listing.showPhoneNumber) {
          sanitizedListing.listedBy.phone = null;
          sanitizedListing.listedBy.brokeragePhone = null;
        }
      }
      if (!listing.showPhoneNumber && Array.isArray(sanitizedListing.coBrokers)) {
        sanitizedListing.coBrokers = sanitizedListing.coBrokers.map((cb) => ({
          ...cb,
          phone: null,
        }));
      }
    }

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
    // Allowlist editable fields via the draft schema. Zod strips every key not
    // in the schema, so a caller can't mass-assign privileged columns —
    // listedById (would hijack the listing onto a victim), status (bypasses the
    // verified-email publish gate), viewCount/saveCount (fake metrics),
    // shareToken, listingNumber, createdAt, etc.
    const parsed = listingDraftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }
    // Photos are handled via the nested relation, not a scalar column.
    // (Cast to any: the Zod parse above is the security boundary — it has
    // already stripped every non-editable field.)
    const { photos: photoUpdates, ...rest } = parsed.data as any;

    // Never overwrite a NON-nullable column with null — the draft schema marks
    // these optional/nullable (for partial draft saves), but the DB rejects
    // null, which surfaced as a generic "Failed to update listing". Drop any
    // that came through null/undefined so the existing value is kept.
    const NON_NULLABLE = [
      "title", "description", "category", "askingPrice", "address",
      "neighborhood", "borough", "city", "state", "zipCode",
      "latitude", "longitude",
    ];
    for (const f of NON_NULLABLE) {
      if (rest[f] === null || rest[f] === undefined) delete rest[f];
    }

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
            (
              p: {
                url: string;
                order?: number;
                thumbUrl?: string | null;
                cardUrl?: string | null;
                fullUrl?: string | null;
              },
              idx: number,
            ) => ({
              listingId: id,
              url: p.url,
              thumbUrl: p.thumbUrl ?? null,
              cardUrl: p.cardUrl ?? null,
              fullUrl: p.fullUrl ?? null,
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
