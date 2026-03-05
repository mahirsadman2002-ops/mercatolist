import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Get a single saved search by ID
export async function GET(
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

    const { id } = await params;

    const savedSearch = await prisma.savedSearch.findUnique({
      where: { id },
    });

    if (!savedSearch) {
      return NextResponse.json(
        { success: false, error: "Saved search not found" },
        { status: 404 }
      );
    }

    if (savedSearch.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: savedSearch });
  } catch (error) {
    console.error("Error fetching saved search:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch saved search" },
      { status: 500 }
    );
  }
}

// PUT: Update a saved search
export async function PUT(
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

    const { id } = await params;

    const savedSearch = await prisma.savedSearch.findUnique({
      where: { id },
    });

    if (!savedSearch) {
      return NextResponse.json(
        { success: false, error: "Saved search not found" },
        { status: 404 }
      );
    }

    if (savedSearch.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, criteria, checkFrequency, emailFrequency } = body;

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

    // Validate criteria if provided
    if (criteria && typeof criteria !== "object") {
      return NextResponse.json(
        { success: false, error: "Criteria must be an object" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name?.trim() || null;
    if (criteria !== undefined) updateData.criteria = criteria;
    if (checkFrequency !== undefined) updateData.checkFrequency = checkFrequency;
    if (emailFrequency !== undefined) updateData.emailFrequency = emailFrequency;

    const updated = await prisma.savedSearch.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating saved search:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update saved search" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a saved search
export async function DELETE(
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

    const { id } = await params;

    const savedSearch = await prisma.savedSearch.findUnique({
      where: { id },
    });

    if (!savedSearch) {
      return NextResponse.json(
        { success: false, error: "Saved search not found" },
        { status: 404 }
      );
    }

    if (savedSearch.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    await prisma.savedSearch.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("Error deleting saved search:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete saved search" },
      { status: 500 }
    );
  }
}
