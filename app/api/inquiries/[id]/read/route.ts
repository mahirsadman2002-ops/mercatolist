import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(
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

    // Only the receiver (or sender for sent tab) can mark as read
    if (
      inquiry.senderId !== session.user.id &&
      inquiry.receiverId !== session.user.id
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Mark inquiry as read
    await prisma.inquiry.update({
      where: { id },
      data: { isRead: true },
    });

    // Mark all messages from the other party as read
    await prisma.message.updateMany({
      where: {
        inquiryId: id,
        senderId: { not: session.user.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking inquiry as read:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark as read" },
      { status: 500 }
    );
  }
}
