import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { CollectionEmail } from "@/emails/collection-email";

// POST: Email collection to client
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

    const { id } = await params;

    // Fetch collection with listings and sender info
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        listings: {
          include: {
            photos: {
              orderBy: { order: "asc" },
              take: 1,
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            email: true,
            phone: true,
            role: true,
            brokerageName: true,
          },
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (collection.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Require client email
    if (!collection.clientEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Collection must have a client email address to send emails",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { personalMessage } = body;

    // Send email
    await sendEmail({
      to: collection.clientEmail,
      subject: `Listings for you: ${collection.name}`,
      react: CollectionEmail({
        collectionName: collection.name,
        collectionDescription: collection.description,
        clientName: collection.clientName,
        personalMessage: personalMessage?.trim() || null,
        listings: collection.listings.map((listing) => ({
          id: listing.id,
          slug: listing.slug,
          title: listing.title,
          category: listing.category,
          askingPrice: listing.askingPrice.toString(),
          neighborhood: listing.neighborhood,
          borough: listing.borough,
          photoUrl: listing.photos[0]?.url || null,
        })),
        sender: {
          name: collection.user.displayName || collection.user.name,
          email: collection.user.email,
          phone: collection.user.phone,
          brokerageName: collection.user.brokerageName,
        },
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error emailing collection:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send collection email" },
      { status: 500 }
    );
  }
}
