import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { inquiryFormSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "received";

    const where =
      tab === "sent"
        ? { senderId: session.user.id }
        : { receiverId: session.user.id };

    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        listing: { select: { id: true, title: true, slug: true } },
        sender: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        receiver: { select: { id: true, name: true, email: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ success: true, data: inquiries });
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inquiries" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = inquiryFormSchema.parse(body);

    const listing = await prisma.businessListing.findUnique({
      where: { id: validated.listingId },
      select: { listedById: true },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    // Check if user is logged in
    const session = await auth();

    const inquiry = await prisma.inquiry.create({
      data: {
        type: "ANONYMOUS_FORM",
        senderName: validated.senderName,
        senderEmail: validated.senderEmail,
        senderPhone: validated.senderPhone || null,
        message: validated.message,
        listingId: validated.listingId,
        senderId: session?.user?.id || null,
        receiverId: listing.listedById,
      },
    });

    // TODO: Send email notification to listing owner
    // TODO: Send confirmation email to inquirer

    return NextResponse.json(
      { success: true, data: inquiry },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    console.error("Error creating inquiry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send inquiry" },
      { status: 500 }
    );
  }
}
