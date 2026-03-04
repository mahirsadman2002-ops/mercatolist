import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { listingCreateSchema } from "@/lib/validations";
import { slugify, generateShareToken } from "@/lib/utils";
import { Prisma } from "@prisma/client";

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

    const where: Prisma.BusinessListingWhereInput = {
      isGhostListing: false,
    };

    // Status filter
    if (status) {
      const statuses = status.split(",").filter(Boolean);
      if (statuses.length > 0) {
        where.status = { in: statuses as any[] };
      }
    } else {
      where.status = "ACTIVE";
    }

    // Keyword search
    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: "insensitive" } },
        { description: { contains: keyword, mode: "insensitive" } },
        { neighborhood: { contains: keyword, mode: "insensitive" } },
        { address: { contains: keyword, mode: "insensitive" } },
      ];
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

    return NextResponse.json({
      success: true,
      data: listings,
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

    const body = await request.json();
    const validated = listingCreateSchema.parse(body);

    // Generate slug
    let slug = slugify(validated.title);
    const existingSlug = await prisma.businessListing.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Calculate derived fields
    const profitMargin =
      validated.annualRevenue && validated.netIncome
        ? Number(
            ((validated.netIncome / validated.annualRevenue) * 100).toFixed(2)
          )
        : null;
    const askingMultiple =
      validated.cashFlowSDE && validated.cashFlowSDE > 0
        ? Number((validated.askingPrice / validated.cashFlowSDE).toFixed(2))
        : null;

    // Generate share token for ghost listings
    const shareToken = validated.isGhostListing ? generateShareToken() : null;

    const listing = await prisma.businessListing.create({
      data: {
        ...validated,
        slug,
        profitMargin,
        askingMultiple,
        shareToken,
        listedById: session.user.id,
      },
      include: { photos: true },
    });

    return NextResponse.json(
      { success: true, data: listing },
      { status: 201 }
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
