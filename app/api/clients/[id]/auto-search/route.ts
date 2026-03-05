import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Create a SavedSearch linked to the broker with client info for notification routing
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

    // Verify user is a broker
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "BROKER") {
      return NextResponse.json(
        { success: false, error: "Only brokers can create auto-searches for clients" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Find the collection to get client info
    const collection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 }
      );
    }

    if (collection.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    if (!collection.clientEmail) {
      return NextResponse.json(
        { success: false, error: "This collection has no associated client email" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { criteria, checkFrequency, emailFrequency } = body;

    if (!criteria || typeof criteria !== "object") {
      return NextResponse.json(
        { success: false, error: "Search criteria is required and must be an object" },
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

    // Include client email in criteria for notification routing
    const storedCriteria = {
      ...criteria,
      clientEmail: collection.clientEmail,
      clientName: collection.clientName || undefined,
    };

    const savedSearch = await prisma.savedSearch.create({
      data: {
        userId: session.user.id,
        name: collection.clientName
          ? `Auto-search for ${collection.clientName}`
          : `Auto-search for ${collection.clientEmail}`,
        criteria: storedCriteria,
        checkFrequency: checkFrequency || "DAILY",
        emailFrequency: emailFrequency || "DAILY_DIGEST",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: savedSearch,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating auto-search:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create auto-search for client" },
      { status: 500 }
    );
  }
}
