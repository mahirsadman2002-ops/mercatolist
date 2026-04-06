import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ImportDeal {
  businessName?: string;
  category?: string;
  borough?: string;
  neighborhood?: string;
  salePrice?: number;
  dateSold?: string;
  notes?: string;
}

// POST: Bulk import past deals for the current user
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

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: "Request body must be a JSON array of deals" },
        { status: 400 }
      );
    }

    if (body.length === 0) {
      return NextResponse.json(
        { success: false, error: "Array must contain at least one deal" },
        { status: 400 }
      );
    }

    if (body.length > 500) {
      return NextResponse.json(
        { success: false, error: "Maximum 500 deals per import" },
        { status: 400 }
      );
    }

    const validDeals: Array<{
      userId: string;
      businessName: string;
      category: string | null;
      borough: string | null;
      neighborhood: string | null;
      salePrice: number | null;
      dateSold: Date | null;
      notes: string | null;
    }> = [];
    const errors: Array<{ index: number; error: string }> = [];

    body.forEach((deal: ImportDeal, index: number) => {
      if (
        !deal.businessName ||
        typeof deal.businessName !== "string" ||
        deal.businessName.trim().length === 0
      ) {
        errors.push({ index, error: "businessName is required" });
        return;
      }

      let parsedDate: Date | null = null;
      if (deal.dateSold) {
        parsedDate = new Date(deal.dateSold);
        if (isNaN(parsedDate.getTime())) {
          errors.push({ index, error: "Invalid dateSold format" });
          return;
        }
      }

      let parsedPrice: number | null = null;
      if (deal.salePrice != null) {
        parsedPrice = Number(deal.salePrice);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          errors.push({ index, error: "Invalid salePrice" });
          return;
        }
      }

      validDeals.push({
        userId: session.user.id,
        businessName: deal.businessName.trim(),
        category: deal.category?.trim() || null,
        borough: deal.borough?.trim() || null,
        neighborhood: deal.neighborhood?.trim() || null,
        salePrice: parsedPrice,
        dateSold: parsedDate,
        notes: deal.notes?.trim() || null,
      });
    });

    let importedCount = 0;
    if (validDeals.length > 0) {
      const result = await prisma.pastDeal.createMany({
        data: validDeals,
      });
      importedCount = result.count;
    }

    return NextResponse.json({
      success: true,
      data: {
        imported: importedCount,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error("POST /api/past-deals/import error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to import past deals" },
      { status: 500 }
    );
  }
}
