import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { listingCreateSchema, listingDraftSchema } from "@/lib/validations";
import { slugify, generateShareToken } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { applyAddressPrivacyToList } from "@/lib/address-privacy";
import { rateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { requireVerifiedEmail } from "@/lib/require-verified";
import { validateNycLocation } from "@/lib/nyc-geo";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sort = searchParams.get("sort") || "newest";
    const keyword = searchParams.get("keyword") || "";
    const category = searchParams.get("category") || "";
    const borough = searchParams.get("borough") || "";
    const neighborhood = searchParams.get("neighborhood") || "";
    const zipCode = searchParams.get("zipCode") || "";
    const priceMin = searchParams.get("priceMin");
    const priceMax = searchParams.get("priceMax");
    const revenueMin = searchParams.get("revenueMin");
    const revenueMax = searchParams.get("revenueMax");
    const daysOnMarket = searchParams.get("daysOnMarket");
    const status = searchParams.get("status") || "";
    const sellerFinancing = searchParams.get("sellerFinancing");
    const sbaFinancing = searchParams.get("sbaFinancing");
    const assetSale = searchParams.get("assetSale");

    const where: Prisma.BusinessListingWhereInput = {
      isGhostListing: false,
    };

    // Status filter. This is a PUBLIC, unauthenticated endpoint, so callers may
    // only ever see published statuses — never DRAFT or OFF_MARKET, which are
    // private to the owner (drafts skip email verification precisely because
    // they aren't public). Any requested status outside the allowlist is
    // dropped rather than honored.
    const PUBLIC_STATUSES = ["ACTIVE", "UNDER_CONTRACT", "SOLD"];
    if (status) {
      const statuses = status
        .split(",")
        .filter(Boolean)
        .filter((s) => PUBLIC_STATUSES.includes(s));
      where.status = {
        in: (statuses.length > 0 ? statuses : PUBLIC_STATUSES) as any[],
      };
    } else {
      where.status = "ACTIVE";
    }

    // Keyword search. If it looks like a listing number ("ML-1042", "#1042",
    // or "1042"), match that exact listing instead of a text search.
    if (keyword) {
      const numMatch = keyword.trim().match(/^(?:ml[-\s]?|#)?(\d{1,9})$/i);
      if (numMatch) {
        where.listingNumber = parseInt(numMatch[1], 10);
      } else {
        where.OR = [
          { title: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
          { neighborhood: { contains: keyword, mode: "insensitive" } },
          { address: { contains: keyword, mode: "insensitive" } },
        ];
      }
    }

    // Category filter (comma-separated)
    if (category) {
      const categories = category.split(",").filter(Boolean);
      if (categories.length > 0) {
        where.category = { in: categories };
      }
    }

    // Borough filter (comma-separated)
    if (borough) {
      const boroughs = borough.split(",").filter(Boolean);
      if (boroughs.length > 0) {
        where.borough = { in: boroughs as any[] };
      }
    }

    // Neighborhood filter
    if (neighborhood) {
      const neighborhoods = neighborhood.split(",").filter(Boolean);
      if (neighborhoods.length > 0) {
        where.neighborhood = { in: neighborhoods };
      }
    }

    // ZIP code
    if (zipCode) {
      where.zipCode = zipCode;
    }

    // Price range
    if (priceMin || priceMax) {
      where.askingPrice = {};
      if (priceMin) where.askingPrice.gte = parseFloat(priceMin);
      if (priceMax) where.askingPrice.lte = parseFloat(priceMax);
    }

    // Revenue range
    if (revenueMin || revenueMax) {
      where.annualRevenue = {};
      if (revenueMin) where.annualRevenue.gte = parseFloat(revenueMin);
      if (revenueMax) where.annualRevenue.lte = parseFloat(revenueMax);
    }

    // Days on market
    if (daysOnMarket) {
      const now = new Date();
      let dateThreshold: Date | undefined;
      switch (daysOnMarket) {
        case "7":
          dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30":
          dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90":
          dateThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "90+":
          dateThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
      }
      if (dateThreshold) {
        if (daysOnMarket === "90+") {
          where.createdAt = { lte: dateThreshold };
        } else {
          where.createdAt = { gte: dateThreshold };
        }
      }
    }

    // Financing filters
    if (sellerFinancing === "true") where.sellerFinancing = true;
    if (sbaFinancing === "true") where.sbaFinancingAvailable = true;
    if (assetSale === "true") where.assetSale = true;

    // Sort
    let orderBy: Prisma.BusinessListingOrderByWithRelationInput;
    switch (sort) {
      case "price_asc":
        orderBy = { askingPrice: "asc" };
        break;
      case "price_desc":
        orderBy = { askingPrice: "desc" };
        break;
      case "revenue_desc":
        orderBy = { annualRevenue: { sort: "desc", nulls: "last" } };
        break;
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      prisma.businessListing.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          photos: { orderBy: { order: "asc" }, take: 1 },
          listedBy: {
            select: {
              id: true,
              name: true,
              displayName: true,
              avatarUrl: true,
              role: true,
              brokerageName: true,
            },
          },
        },
      }),
      prisma.businessListing.count({ where }),
    ]);

    // Apply address privacy to listings with hideAddress=true
    const sanitizedListings = applyAddressPrivacyToList(listings as any[]);

    // Log meaningful searches (keyword or any filter) on the first page only, so
    // pagination and plain browsing don't flood the table. Best-effort: a failure
    // here must never break the search response.
    const activeFilters: Record<string, string> = {};
    if (category) activeFilters.category = category;
    if (borough) activeFilters.borough = borough;
    if (neighborhood) activeFilters.neighborhood = neighborhood;
    if (zipCode) activeFilters.zipCode = zipCode;
    if (priceMin) activeFilters.priceMin = priceMin;
    if (priceMax) activeFilters.priceMax = priceMax;
    if (revenueMin) activeFilters.revenueMin = revenueMin;
    if (revenueMax) activeFilters.revenueMax = revenueMax;
    if (daysOnMarket) activeFilters.daysOnMarket = daysOnMarket;
    if (sellerFinancing === "true") activeFilters.sellerFinancing = "true";
    if (sbaFinancing === "true") activeFilters.sbaFinancing = "true";
    if (assetSale === "true") activeFilters.assetSale = "true";

    const hasSearchIntent = Boolean(keyword) || Object.keys(activeFilters).length > 0;
    if (page === 1 && hasSearchIntent) {
      try {
        const session = await auth();
        await prisma.searchLog.create({
          data: {
            query: keyword,
            filters: Object.keys(activeFilters).length > 0 ? activeFilters : undefined,
            resultCount: total,
            userId: session?.user?.id ?? null,
          },
        });
      } catch (logError) {
        console.error("Failed to log search:", logError);
      }
    }

    return NextResponse.json({
      success: true,
      data: sanitizedListings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const limit = await rateLimit(request, "write", session.user.id);
    if (!limit.success) return rateLimitResponse(limit.retryAfterSec);

    const body = await request.json();
    const isDraft = body?.status === "DRAFT" || body?.draft === true;

    // Drafts are private, so allow them; publishing a live listing requires a
    // verified email.
    if (!isDraft) {
      const verified = await requireVerifiedEmail(session.user.id, "publish a listing");
      if (!verified.verified) return verified.response;
    }

    // Drafts skip the full required-field validation so users can save partial
    // progress; we still validate types/lengths via the relaxed schema.
    const validated = isDraft
      ? listingDraftSchema.parse(body)
      : listingCreateSchema.parse(body);

    // Geo-lock: a live listing must be inside the five NYC boroughs. (Drafts
    // may still be incomplete; they're re-checked at publish time.)
    if (!isDraft) {
      const geo = validateNycLocation({
        borough: validated.borough,
        zipCode: validated.zipCode,
        latitude: validated.latitude,
        longitude: validated.longitude,
      });
      if (!geo.ok) {
        return NextResponse.json(
          { success: false, error: geo.error },
          { status: 400 }
        );
      }
    }

    // Generate slug — use title if present, otherwise a placeholder for drafts.
    const baseTitle = validated.title?.trim() || "untitled-listing";
    let slug = slugify(baseTitle);
    const existingSlug = await prisma.businessListing.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const profitMargin =
      validated.annualRevenue && validated.netIncome
        ? Number(
            ((validated.netIncome / validated.annualRevenue) * 100).toFixed(2),
          )
        : null;
    const askingMultiple =
      validated.askingPrice &&
      validated.cashFlowSDE &&
      validated.cashFlowSDE > 0
        ? Number((validated.askingPrice / validated.cashFlowSDE).toFixed(2))
        : null;

    const shareToken = validated.isGhostListing ? generateShareToken() : null;
    const photos = Array.isArray(validated.photos) ? validated.photos : [];

    // Strip photos from the spread — we create them via the nested relation instead.
    const { photos: _photos, ...listingData } = validated;
    void _photos;

    const listing = await prisma.businessListing.create({
      data: {
        ...(listingData as Prisma.BusinessListingUncheckedCreateInput),
        status: isDraft ? "DRAFT" : "ACTIVE",
        // Drafts can have missing required fields — fall back to safe defaults so
        // the DB accepts the row. They'll be overwritten when the user finishes.
        title: validated.title?.trim() || "Untitled listing",
        description: validated.description?.trim() || "",
        category: validated.category || "Other",
        askingPrice: validated.askingPrice ?? 0,
        address: validated.address?.trim() || "",
        neighborhood: validated.neighborhood?.trim() || "",
        borough: (validated.borough as "MANHATTAN") || "MANHATTAN",
        zipCode: validated.zipCode?.trim() || "00000",
        latitude: validated.latitude ?? 0,
        longitude: validated.longitude ?? 0,
        slug,
        profitMargin,
        askingMultiple,
        shareToken,
        listedById: session.user.id,
        photos:
          photos.length > 0
            ? {
                create: photos.map((p, idx) => ({
                  url: p.url,
                  order: typeof p.order === "number" ? p.order : idx,
                })),
              }
            : undefined,
      },
      include: { photos: true },
    });

    return NextResponse.json(
      { success: true, data: listing },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    console.error("Error creating listing:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create listing" },
      { status: 500 }
    );
  }
}
