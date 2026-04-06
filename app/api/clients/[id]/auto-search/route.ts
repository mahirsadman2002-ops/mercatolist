import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Create a SavedSearch linked to the advisor with client info for notification routing
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

    if (session.user.role !== "BROKER") {
      return NextResponse.json(
        { success: false, error: "Only advisors can create auto-searches for clients" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // FIX: Use Client model instead of old Collection-based client fields
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    if (client.advisorId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { criteria, checkFrequency, emailFrequency } = body;

    if (!criteria || typeof criteria !== "object") {
      return NextResponse.json(
        { success: false, error: "Search criteria is required" },
        { status: 400 }
      );
    }

    if (checkFrequency && !["DAILY", "WEEKLY"].includes(checkFrequency)) {
      return NextResponse.json(
        { success: false, error: "checkFrequency must be DAILY or WEEKLY" },
        { status: 400 }
      );
    }

    if (emailFrequency && !["IMMEDIATELY", "DAILY_DIGEST", "WEEKLY_DIGEST"].includes(emailFrequency)) {
      return NextResponse.json(
        { success: false, error: "emailFrequency must be IMMEDIATELY, DAILY_DIGEST, or WEEKLY_DIGEST" },
        { status: 400 }
      );
    }

    const storedCriteria = {
      ...criteria,
      clientEmail: client.email,
      clientName: client.name,
    };

    const savedSearch = await prisma.savedSearch.create({
      data: {
        userId: session.user.id,
        name: `Auto-search for ${client.name}`,
        criteria: storedCriteria,
        checkFrequency: checkFrequency || "DAILY",
        emailFrequency: emailFrequency || "DAILY_DIGEST",
      },
    });

    return NextResponse.json({ success: true, data: savedSearch }, { status: 201 });
  } catch (error) {
    console.error("Error creating auto-search:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create auto-search for client" },
      { status: 500 }
    );
  }
}
