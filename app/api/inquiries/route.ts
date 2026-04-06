import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { inquiryFormSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import InquiryReceived from "@/emails/inquiry-received";
import InquiryConfirmation from "@/emails/inquiry-confirmation";
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

    if (type === "ANONYMOUS_FORM" || type === "MESSAGE_THREAD") {
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

    const isMessageThread = body.type === "MESSAGE_THREAD";

    const session = await auth();

    // Message threads require auth
    if (isMessageThread && !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Login required to send messages" },
        { status: 401 }
      );
    }

    // For anonymous form, validate with schema
    if (!isMessageThread) {
      const parsed = inquiryFormSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation failed",
            details: parsed.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }
      body.senderName = parsed.data.senderName;
      body.senderEmail = parsed.data.senderEmail;
      body.senderPhone = parsed.data.senderPhone;
      body.message = parsed.data.message;
      body.listingId = parsed.data.listingId;
    } else {
      // For message threads, validate required fields manually
      if (!body.listingId || typeof body.listingId !== "string") {
        return NextResponse.json(
          { success: false, error: "Listing ID is required" },
          { status: 400 }
        );
      }
      if (!body.message || typeof body.message !== "string" || body.message.trim().length < 1) {
        return NextResponse.json(
          { success: false, error: "Message is required" },
          { status: 400 }
        );
      }
    }

    // Look up listing by id first, then fall back to slug
    const listing = await prisma.businessListing.findFirst({
      where: {
        OR: [
          { id: body.listingId },
          { slug: body.listingId },
        ],
      },
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

    // Normalize listingId to the actual database ID (in case slug was passed)
    const resolvedListingId = listing.id;

    // Can't message yourself
    if (session?.user?.id === listing.listedById) {
      return NextResponse.json(
        { success: false, error: "You cannot contact your own listing" },
        { status: 400 }
      );
    }

    // Rate limit for anonymous: max 5 per email per hour
    if (!isMessageThread && body.senderEmail) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = await prisma.inquiry.count({
        where: {
          senderEmail: body.senderEmail,
          createdAt: { gte: oneHourAgo },
        },
      });
      if (recentCount >= 5) {
        return NextResponse.json(
          {
            success: false,
            error: "Too many inquiries. Please try again later.",
          },
          { status: 429 }
        );
      }
    }

    // For message threads, check if one already exists
    if (isMessageThread && session?.user?.id) {
      const existing = await prisma.inquiry.findFirst({
        where: {
          listingId: resolvedListingId,
          senderId: session.user.id,
          type: "MESSAGE_THREAD",
        },
      });

      if (existing) {
        // Add message to existing thread instead
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
        const baseUrl =
          process.env.NEXTAUTH_URL || "https://mercatolist.com";
        try {
          await sendEmail({
            to: listing.listedBy.email,
            subject: `New message about ${listing.title}`,
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
    }

    // Create the inquiry
    const inquiry = await prisma.inquiry.create({
      data: {
        type: isMessageThread ? "MESSAGE_THREAD" : "ANONYMOUS_FORM",
        senderName: isMessageThread ? null : body.senderName,
        senderEmail: isMessageThread ? null : body.senderEmail,
        senderPhone:
          isMessageThread ? null : body.senderPhone || null,
        message: body.message,
        listingId: resolvedListingId,
        senderId: session?.user?.id || null,
        receiverId: listing.listedById,
      },
    });

    // For message threads, create the first message
    if (isMessageThread && session?.user?.id) {
      await prisma.message.create({
        data: {
          content: body.message,
          inquiryId: inquiry.id,
          senderId: session.user.id,
        },
      });
    }

    // Send email notifications
    const baseUrl =
      process.env.NEXTAUTH_URL || "https://mercatolist.com";

    try {
      if (isMessageThread) {
        // New message thread notification
        await sendEmail({
          to: listing.listedBy.email,
          subject: `New message about ${listing.title}`,
          react: NewMessage({
            senderName: session?.user?.name || "Someone",
            listingTitle: listing.title,
            messagePreview:
              body.message.length > 200
                ? body.message.slice(0, 200) + "..."
                : body.message,
            threadUrl: `${baseUrl}/inquiries`,
          }),
        });
      } else {
        // Anonymous inquiry notification to owner
        await sendEmail({
          to: listing.listedBy.email,
          subject: `New inquiry on ${listing.title}`,
          react: InquiryReceived({
            listingTitle: listing.title,
            senderName: body.senderName,
            senderEmail: body.senderEmail,
            senderPhone: body.senderPhone || undefined,
            message: body.message,
            dashboardUrl: `${baseUrl}/inquiries`,
          }),
        });

        // Confirmation to the sender (if they have an account)
        if (body.senderEmail) {
          const senderUser = await prisma.user.findUnique({
            where: { email: body.senderEmail },
          });
          if (senderUser) {
            await sendEmail({
              to: body.senderEmail,
              subject: `Your inquiry about ${listing.title}`,
              react: InquiryConfirmation({
                listingTitle: listing.title,
                senderName: body.senderName,
                message: body.message,
                senderEmail: body.senderEmail,
                browseUrl: `${baseUrl}/listings`,
              }),
            });
          }
        }
      }
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
