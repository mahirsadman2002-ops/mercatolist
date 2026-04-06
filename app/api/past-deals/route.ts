import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: List past deals for the current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const deals = await prisma.pastDeal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: deals });
  } catch (error) {
    console.error("GET /api/past-deals error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch past deals" },
      { status: 500 }
    );
  }
}

// POST: Create a new past deal
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
    const { businessName, category, borough, neighborhood, salePrice, dateSold, notes } =
      body;

    if (!businessName || typeof businessName !== "string" || businessName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Business name is required" },
        { status: 400 }
      );
    }

    const deal = await prisma.pastDeal.create({
      data: {
        userId: session.user.id,
        businessName: businessName.trim(),
        category: category?.trim() || null,
        borough: borough?.trim() || null,
        neighborhood: neighborhood?.trim() || null,
        salePrice: salePrice != null ? salePrice : null,
        dateSold: dateSold ? new Date(dateSold) : null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, data: deal }, { status: 201 });
  } catch (error) {
    console.error("POST /api/past-deals error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create past deal" },
      { status: 500 }
    );
  }
}
