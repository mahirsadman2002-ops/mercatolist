import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: List all saved searches for current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: savedSearches });
  } catch (error) {
    console.error("Error fetching saved searches:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch saved searches" },
      { status: 500 }
    );
  }
}

// POST: Create a new saved search
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
    const { name, criteria, checkFrequency, emailFrequency, clientEmail } = body;

    if (!criteria || typeof criteria !== "object") {
      return NextResponse.json(
        { success: false, error: "Search criteria is required and must be an object" },
        { status: 400 }
      );
    }

    // Validate criteria fields
    const allowedCriteriaKeys = [
      "category",
      "borough",
      "neighborhood",
      "priceMin",
      "priceMax",
      "revenueMin",
      "revenueMax",
    ];
    const criteriaKeys = Object.keys(criteria);
    const hasValidKeys = criteriaKeys.some((key) =>
      allowedCriteriaKeys.includes(key)
    );

    if (criteriaKeys.length === 0 || !hasValidKeys) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Criteria must include at least one of: category, borough, neighborhood, priceMin, priceMax, revenueMin, revenueMax",
        },
        { status: 400 }
      );
    }

    // Validate checkFrequency if provided
    if (
      checkFrequency &&
      !["DAILY", "WEEKLY"].includes(checkFrequency)
    ) {
      return NextResponse.json(
        { success: false, error: "checkFrequency must be DAILY or WEEKLY" },
        { status: 400 }
      );
    }

    // Validate emailFrequency if provided
    if (
      emailFrequency &&
      !["IMMEDIATELY", "DAILY_DIGEST", "WEEKLY_DIGEST"].includes(emailFrequency)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "emailFrequency must be IMMEDIATELY, DAILY_DIGEST, or WEEKLY_DIGEST",
        },
        { status: 400 }
      );
    }

    // If clientEmail is provided (broker assigning to client), include it in criteria
    const storedCriteria = clientEmail
      ? { ...criteria, clientEmail }
      : criteria;

    const savedSearch = await prisma.savedSearch.create({
      data: {
        userId: session.user.id,
        name: name?.trim() || null,
        criteria: storedCriteria,
        checkFrequency: checkFrequency || "DAILY",
        emailFrequency: emailFrequency || "DAILY_DIGEST",
      },
    });

    return NextResponse.json(
      { success: true, data: savedSearch },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating saved search:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create saved search" },
      { status: 500 }
    );
  }
}
