import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
        messages: {
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
        },
      },
    });

    if (!inquiry) {
      return NextResponse.json(
        { success: false, error: "Inquiry not found" },
        { status: 404 }
      );
    }

    // Only sender or receiver can view
    if (
      inquiry.senderId !== session.user.id &&
      inquiry.receiverId !== session.user.id
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Auto-mark as read when the receiver opens it
    if (inquiry.receiverId === session.user.id && !inquiry.isRead) {
      await prisma.inquiry.update({
        where: { id },
        data: { isRead: true },
      });
    }

    // Mark messages from the other party as read
    await prisma.message.updateMany({
      where: {
        inquiryId: id,
        senderId: { not: session.user.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, data: inquiry });
  } catch (error) {
    console.error("Error fetching inquiry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inquiry" },
      { status: 500 }
    );
  }
}
