import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/utils";
import { Prisma } from "@prisma/client";

// GET: Paginated listing management with filters
export async function GET(request: NextRequest) {
  try {
    const adminAuth = await requireAdmin();
    if (!adminAuth.authorized) return adminAuth.response;

    const { searchParams } = new URL(request.url);

    // Parse query params
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const category = searchParams.get("category") || undefined;
    const borough = searchParams.get("borough") || undefined;
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";
    const featured = searchParams.get("featured");

    // Build where clause
    const where: Prisma.BusinessListingWhereInput = {};

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    if (status) {
      where.status = status as Prisma.EnumListingStatusFilter;
    }

    if (category) {
      where.category = category;
    }

    if (borough) {
      where.borough = borough as Prisma.EnumBoroughFilter;
    }

    if (featured === "true") {
      where.isFeatured = true;
    } else if (featured === "false") {
      where.isFeatured = false;
    }

    // Validate sort field
    const allowedSortFields = ["createdAt", "askingPrice", "viewCount", "updatedAt", "title"];
    const sortField = allowedSortFields.includes(sort) ? sort : "createdAt";
    const sortOrder = order === "asc" ? "asc" : "desc";

    // Execute queries in parallel
    const [listings, total] = await Promise.all([
      prisma.businessListing.findMany({
        where,
        include: {
          listedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          photos: {
            take: 1,
            orderBy: { order: "asc" },
          },
          _count: {
            select: {
              inquiries: true,
            },
          },
        },
        orderBy: { [sortField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.businessListing.count({ where }),
    ]);

    // Convert Decimal fields to Number for JSON serialization
    const serializedListings = listings.map((listing) => ({
      ...listing,
      askingPrice: Number(listing.askingPrice),
      annualRevenue: listing.annualRevenue ? Number(listing.annualRevenue) : null,
      cashFlowSDE: listing.cashFlowSDE ? Number(listing.cashFlowSDE) : null,
      netIncome: listing.netIncome ? Number(listing.netIncome) : null,
      profitMargin: listing.profitMargin ? Number(listing.profitMargin) : null,
      askingMultiple: listing.askingMultiple ? Number(listing.askingMultiple) : null,
      monthlyRent: listing.monthlyRent ? Number(listing.monthlyRent) : null,
      annualPayroll: listing.annualPayroll ? Number(listing.annualPayroll) : null,
      totalExpenses: listing.totalExpenses ? Number(listing.totalExpenses) : null,
      inventoryValue: listing.inventoryValue ? Number(listing.inventoryValue) : null,
      ffeValue: listing.ffeValue ? Number(listing.ffeValue) : null,
      soldPrice: listing.soldPrice ? Number(listing.soldPrice) : null,
      latitude: Number(listing.latitude),
      longitude: Number(listing.longitude),
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: serializedListings,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Admin listings GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}

// POST: Admin creates a listing on behalf of a seller/advisor.
// - Finds or creates the owner account (auto-verified, no password = "unclaimed").
// - Publishes the listing live immediately, bypassing the email-verification gate.
export async function POST(request: NextRequest) {
  const { authorized, response } = await requireAdmin();
  if (!authorized) return response;

  try {
    const body = await request.json();
    const seller = body.seller ?? {};
    const listing = body.listing ?? {};

    // --- Validate the owner ---
    const email = String(seller.email || "").trim().toLowerCase();
    const name = String(seller.name || "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "A valid seller email is required." },
        { status: 400 }
      );
    }
    if (!name) {
      return NextResponse.json(
        { success: false, error: "Seller name is required." },
        { status: 400 }
      );
    }
    // "ADVISOR" maps to the BROKER role; "SELLER" to a regular USER.
    const role = seller.accountType === "ADVISOR" ? "BROKER" : "USER";

    // --- Minimal listing validation (admin is trusted; keep it light) ---
    if (!listing.title || !listing.category || listing.askingPrice == null) {
      return NextResponse.json(
        { success: false, error: "Listing needs at least a title, category, and asking price." },
        { status: 400 }
      );
    }

    // --- Find or create the owner account ---
    let owner = await prisma.user.findUnique({ where: { email } });
    let ownerCreated = false;
    if (!owner) {
      owner = await prisma.user.create({
        data: {
          email,
          name,
          phone: seller.phone ? String(seller.phone).trim() : null,
          role,
          brokerageName:
            role === "BROKER" && seller.brokerageName
              ? String(seller.brokerageName).trim()
              : null,
          // Auto-verified so the listing is public and the owner is trusted;
          // no hashedPassword yet — that's set when they claim the account.
          emailVerified: new Date(),
        },
      });
      ownerCreated = true;
    } else if (role === "BROKER" && owner.role === "USER") {
      // Upgrade an existing plain user to advisor if requested.
      owner = await prisma.user.update({
        where: { id: owner.id },
        data: {
          role: "BROKER",
          brokerageName: seller.brokerageName
            ? String(seller.brokerageName).trim()
            : owner.brokerageName,
        },
      });
    }

    // --- Build the listing ---
    const baseTitle = String(listing.title).trim();
    let slug = slugify(baseTitle);
    const existing = await prisma.businessListing.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const num = (v: unknown) => (v == null || v === "" ? null : Number(v));

    const askingPrice = Number(listing.askingPrice);
    const annualRevenue = num(listing.annualRevenue);
    const netIncome = num(listing.netIncome);
    const cashFlowSDE = num(listing.cashFlowSDE);

    const profitMargin =
      annualRevenue && netIncome
        ? Number(((netIncome / annualRevenue) * 100).toFixed(2))
        : null;
    const askingMultiple =
      askingPrice && cashFlowSDE && cashFlowSDE > 0
        ? Number((askingPrice / cashFlowSDE).toFixed(2))
        : null;

    const photos: Array<{ url: string; order?: number }> = Array.isArray(listing.photos)
      ? listing.photos
      : [];

    const data: Prisma.BusinessListingUncheckedCreateInput = {
      slug,
      status: "ACTIVE",
      title: baseTitle,
      description: String(listing.description || "").trim(),
      category: String(listing.category),
      askingPrice,
      annualRevenue,
      cashFlowSDE,
      netIncome,
      assetSale: !!listing.assetSale,
      sellerFinancing: !!listing.sellerFinancing,
      sbaFinancingAvailable: !!listing.sbaFinancingAvailable,
      yearEstablished: listing.yearEstablished ? Number(listing.yearEstablished) : null,
      address: String(listing.address || "").trim(),
      hideAddress: !!listing.hideAddress,
      neighborhood: String(listing.neighborhood || "").trim(),
      borough:
        (listing.borough as Prisma.BusinessListingUncheckedCreateInput["borough"]) ||
        "MANHATTAN",
      zipCode: String(listing.zipCode || "").trim() || "00000",
      latitude: num(listing.latitude) ?? 0,
      longitude: num(listing.longitude) ?? 0,
      profitMargin,
      askingMultiple,
      listedById: owner.id,
      photos:
        photos.length > 0
          ? {
              create: photos.map((p, idx) => ({
                url: p.url,
                order: typeof p.order === "number" ? p.order : idx,
              })),
            }
          : undefined,
    };

    const created = await prisma.businessListing.create({
      data,
      select: { id: true, slug: true, title: true },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          listing: created,
          owner: {
            id: owner.id,
            email: owner.email,
            role: owner.role,
            created: ownerCreated,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin create-listing error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create listing" },
      { status: 500 }
    );
  }
}
