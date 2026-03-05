import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import NewMessage from "@/emails/new-message";

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

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      select: { senderId: true, receiverId: true },
    });

    if (!inquiry) {
      return NextResponse.json(
        { success: false, error: "Inquiry not found" },
        { status: 404 }
      );
    }

    if (
      inquiry.senderId !== session.user.id &&
      inquiry.receiverId !== session.user.id
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { inquiryId: id },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Mark messages from the other party as read
    await prisma.message.updateMany({
      where: {
        inquiryId: id,
        senderId: { not: session.user.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

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
    const body = await request.json();

    if (!body.content?.trim()) {
      return NextResponse.json(
        { success: false, error: "Message content is required" },
        { status: 400 }
      );
    }

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        listing: {
          select: { title: true },
        },
        sender: {
          select: { id: true, email: true, name: true },
        },
        receiver: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!inquiry) {
      return NextResponse.json(
        { success: false, error: "Inquiry not found" },
        { status: 404 }
      );
    }

    // Only sender or receiver can post messages
    if (
      inquiry.senderId !== session.user.id &&
      inquiry.receiverId !== session.user.id
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const message = await prisma.message.create({
      data: {
        content: body.content.trim(),
        inquiryId: id,
        senderId: session.user.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Mark inquiry as unread for the other party
    await prisma.inquiry.update({
      where: { id },
      data: { isRead: false },
    });

    // Send email notification to the other party
    const recipientIsReceiver = inquiry.receiverId !== session.user.id;
    const recipient = recipientIsReceiver ? inquiry.receiver : inquiry.sender;

    if (recipient?.email) {
      const baseUrl =
        process.env.NEXTAUTH_URL || "https://mercatolist.com";
      try {
        await sendEmail({
          to: recipient.email,
          subject: `New message about ${inquiry.listing.title}`,
          react: NewMessage({
            senderName: session.user.name || "Someone",
            listingTitle: inquiry.listing.title,
            messagePreview:
              body.content.length > 200
                ? body.content.slice(0, 200) + "..."
                : body.content,
            threadUrl: `${baseUrl}/inquiries`,
          }),
        });
      } catch (e) {
        console.error("Failed to send message notification email:", e);
      }
    }

    return NextResponse.json(
      { success: true, data: message },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}
