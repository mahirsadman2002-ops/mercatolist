import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
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
