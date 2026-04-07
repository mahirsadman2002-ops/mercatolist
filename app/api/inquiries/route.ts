import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { generateReplyToAddress } from "@/lib/email-reply";
import NewMessage from "@/emails/new-message";

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

    // Check if the frontend is asking whether an existing thread exists
    const checkExisting = searchParams.get("checkExisting");
    const checkListingId = searchParams.get("listingId");

    if (checkExisting === "true" && checkListingId) {
      const existing = await prisma.inquiry.findFirst({
        where: {
          listingId: checkListingId,
          senderId: session.user.id,
          type: "MESSAGE_THREAD",
        },
        select: { id: true },
      });

      return NextResponse.json({
        success: true,
        data: {
          hasExistingThread: !!existing,
          inquiryId: existing?.id || undefined,
        },
      });
    }

    const tab = searchParams.get("tab") || "received";
    const listingId = searchParams.get("listingId") || "";
    const type = searchParams.get("type") || "";
    const read = searchParams.get("read") || "";

    const where: Record<string, unknown> =
      tab === "sent"
        ? { senderId: session.user.id }
        : { receiverId: session.user.id };

    if (listingId) {
      where.listingId = listingId;
    }

    if (type === "MESSAGE_THREAD") {
      where.type = type;
    }

    if (read === "unread") {
      where.isRead = false;
    }

    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            photos: { orderBy: { order: "asc" }, take: 1 },
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { messages: true } },
      },
    });

    // For each inquiry, compute unread message count for current user
    const data = await Promise.all(
      inquiries.map(async (inq) => {
        let unreadCount = 0;
        if (inq.type === "MESSAGE_THREAD") {
          unreadCount = await prisma.message.count({
            where: {
              inquiryId: inq.id,
              senderId: { not: session.user.id },
              isRead: false,
            },
          });
        }
        return {
          ...inq,
          unreadMessageCount: unreadCount,
        };
      })
    );

    return NextResponse.json({ success: true, data });
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

    // Honeypot check
    if (body._hp) {
      return NextResponse.json(
        { success: true, data: { id: "ok" } },
        { status: 201 }
      );
    }

    // All inquiries now require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Login required to send messages" },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!body.listingId || typeof body.listingId !== "string") {
      return NextResponse.json(
        { success: false, error: "Listing ID is required" },
        { status: 400 }
      );
    }
    if (
      !body.message ||
      typeof body.message !== "string" ||
      body.message.trim().length < 1
    ) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    // Look up listing by UUID
    const listing = await prisma.businessListing.findUnique({
      where: { id: body.listingId },
      select: {
        id: true,
        title: true,
        slug: true,
        listedById: true,
        photos: { orderBy: { order: "asc" }, take: 1 },
        listedBy: {
          select: { email: true, name: true },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    // Can't message yourself
    if (session.user.id === listing.listedById) {
      return NextResponse.json(
        { success: false, error: "You cannot contact your own listing" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || "https://mercatolist.com";

    // Check if an existing thread exists between this user and this listing
    const existing = await prisma.inquiry.findFirst({
      where: {
        listingId: listing.id,
        senderId: session.user.id,
        type: "MESSAGE_THREAD",
      },
    });

    if (existing) {
      // Add message to existing thread instead of creating a new inquiry
      const message = await prisma.message.create({
        data: {
          content: body.message,
          inquiryId: existing.id,
          senderId: session.user.id,
        },
      });

      // Mark inquiry as unread for the receiver
      await prisma.inquiry.update({
        where: { id: existing.id },
        data: { isRead: false },
      });

      // Send email notification
      try {
        await sendEmail({
          to: listing.listedBy.email,
          subject: `New message about ${listing.title}`,
          replyTo: generateReplyToAddress(existing.id),
          react: NewMessage({
            senderName: session.user.name || "Someone",
            listingTitle: listing.title,
            messagePreview:
              body.message.length > 200
                ? body.message.slice(0, 200) + "..."
                : body.message,
            threadUrl: `${baseUrl}/inquiries`,
          }),
        });
      } catch (e) {
        console.error("Failed to send new message email:", e);
      }

      return NextResponse.json(
        {
          success: true,
          data: { inquiry: existing, message },
          existingThread: true,
        },
        { status: 201 }
      );
    }

    // Create new inquiry with type MESSAGE_THREAD
    const inquiry = await prisma.inquiry.create({
      data: {
        type: "MESSAGE_THREAD",
        senderName: body.senderName || null,
        senderEmail: body.senderEmail || null,
        senderPhone: body.senderPhone || null,
        message: body.message,
        listingId: listing.id,
        senderId: session.user.id,
        receiverId: listing.listedById,
      },
    });

    // Create the first message in the thread
    await prisma.message.create({
      data: {
        content: body.message,
        inquiryId: inquiry.id,
        senderId: session.user.id,
      },
    });

    // Send email notification
    try {
      await sendEmail({
        to: listing.listedBy.email,
        subject: `New message about ${listing.title}`,
        replyTo: generateReplyToAddress(inquiry.id),
        react: NewMessage({
          senderName: session.user.name || "Someone",
          listingTitle: listing.title,
          messagePreview:
            body.message.length > 200
              ? body.message.slice(0, 200) + "..."
              : body.message,
          threadUrl: `${baseUrl}/inquiries`,
        }),
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
    }

    return NextResponse.json(
      { success: true, data: inquiry },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating inquiry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send inquiry" },
      { status: 500 }
    );
  }
}
