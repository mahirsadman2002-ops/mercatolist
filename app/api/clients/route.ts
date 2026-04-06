import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: List all unique clients for current broker (aggregated from Collections)
export async function GET() {
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
        { success: false, error: "Only advisors can access client management" },
        { status: 403 }
      );
    }

    // Get all collections with client info for this broker
    const collections = await prisma.collection.findMany({
      where: {
        userId: session.user.id,
        clientEmail: { not: null },
      },
      select: {
        id: true,
        clientName: true,
        clientEmail: true,
        clientPhone: true,
        clientBuyBox: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Group by clientEmail to get unique clients
    const clientMap = new Map<
      string,
      {
        clientName: string | null;
        clientEmail: string;
        clientPhone: string | null;
        clientBuyBox: unknown;
        collectionCount: number;
        collectionIds: string[];
        lastUpdated: Date;
      }
    >();

    for (const collection of collections) {
      const email = collection.clientEmail!;
      const existing = clientMap.get(email);

      if (existing) {
        existing.collectionCount += 1;
        existing.collectionIds.push(collection.id);
        // Use the most recent name, phone, and buyBox
        if (collection.updatedAt > existing.lastUpdated) {
          existing.clientName = collection.clientName;
          existing.clientPhone = collection.clientPhone;
          existing.clientBuyBox = collection.clientBuyBox;
          existing.lastUpdated = collection.updatedAt;
        }
      } else {
        clientMap.set(email, {
          clientName: collection.clientName,
          clientEmail: email,
          clientPhone: collection.clientPhone,
          clientBuyBox: collection.clientBuyBox,
          collectionCount: 1,
          collectionIds: [collection.id],
          lastUpdated: collection.updatedAt,
        });
      }
    }

    const clients = Array.from(clientMap.values()).sort(
      (a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime()
    );

    return NextResponse.json({ success: true, data: clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

// POST: Create a new client by creating a Collection with client info
export async function POST(request: NextRequest) {
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
        { success: false, error: "Only advisors can create clients" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { clientName, clientEmail, clientPhone, clientBuyBox, collectionName } =
      body;

    if (!clientEmail || typeof clientEmail !== "string" || !clientEmail.trim()) {
      return NextResponse.json(
        { success: false, error: "Client email is required" },
        { status: 400 }
      );
    }

    if (!clientName || typeof clientName !== "string" || !clientName.trim()) {
      return NextResponse.json(
        { success: false, error: "Client name is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail.trim())) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Create a collection with client info
    const collection = await prisma.collection.create({
      data: {
        name: collectionName?.trim() || `${clientName.trim()}'s Collection`,
        userId: session.user.id,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim().toLowerCase(),
        clientPhone: clientPhone?.trim() || null,
        clientBuyBox: clientBuyBox || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: collection.id,
          clientName: collection.clientName,
          clientEmail: collection.clientEmail,
          clientPhone: collection.clientPhone,
          clientBuyBox: collection.clientBuyBox,
          collectionId: collection.id,
          collectionName: collection.name,
          createdAt: collection.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create client" },
      { status: 500 }
    );
  }
}
