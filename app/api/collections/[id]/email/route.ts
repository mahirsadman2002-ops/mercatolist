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
        collectionListings: {
          include: {
            listing: {
              include: {
                photos: {
                  orderBy: { order: "asc" },
                  take: 1,
                },
              },
            },
          },
        },
        client: true,
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
    if (!collection.client?.email) {
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
      to: collection.client.email,
      subject: `Listings for you: ${collection.name}`,
      react: CollectionEmail({
        collectionName: collection.name,
        collectionDescription: collection.description,
        clientName: collection.client.name,
        personalMessage: personalMessage?.trim() || null,
        listings: collection.collectionListings.map((cl: { listing: { id: string; slug: string; title: string; category: string; askingPrice: { toString(): string }; neighborhood: string; borough: string; photos: { url: string }[] } }) => ({
          id: cl.listing.id,
          slug: cl.listing.slug,
          title: cl.listing.title,
          category: cl.listing.category,
          askingPrice: cl.listing.askingPrice.toString(),
          neighborhood: cl.listing.neighborhood,
          borough: cl.listing.borough,
          photoUrl: cl.listing.photos[0]?.url || null,
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
