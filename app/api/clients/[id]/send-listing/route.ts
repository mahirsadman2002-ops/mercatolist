import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import SendListing from "@/emails/send-listing";

// POST: Send a specific listing to a client via email
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
      select: { role: true, name: true, brokerageName: true },
    });

    if (user?.role !== "BROKER") {
      return NextResponse.json(
        { success: false, error: "Only brokers can send listings to clients" },
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
    const { listingId, personalMessage } = body;

    if (!listingId || typeof listingId !== "string") {
      return NextResponse.json(
        { success: false, error: "listingId is required" },
        { status: 400 }
      );
    }

    // Get the listing details
    const listing = await prisma.businessListing.findUnique({
      where: { id: listingId },
      include: {
        photos: {
          orderBy: { order: "asc" },
          take: 1,
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    // Send the email
    await sendEmail({
      to: collection.clientEmail,
      subject: `${user.name} shared a listing with you: ${listing.title}`,
      react: SendListing({
        brokerName: user.name,
        brokerageName: user.brokerageName || undefined,
        clientName: collection.clientName || undefined,
        listingTitle: listing.title,
        listingSlug: listing.slug,
        askingPrice: listing.askingPrice.toString(),
        category: listing.category,
        neighborhood: listing.neighborhood,
        borough: listing.borough,
        photoUrl: listing.photos[0]?.url || undefined,
        personalMessage: personalMessage?.trim() || undefined,
      }),
    });

    return NextResponse.json({
      success: true,
      data: {
        sentTo: collection.clientEmail,
        listingId: listing.id,
        listingTitle: listing.title,
      },
    });
  } catch (error) {
    console.error("Error sending listing to client:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send listing to client" },
      { status: 500 }
    );
  }
}
