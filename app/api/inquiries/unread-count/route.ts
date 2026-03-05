import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: true, data: { count: 0 } });
    }

    // Count unread inquiries where the user is the receiver
    const unreadInquiries = await prisma.inquiry.count({
      where: {
        receiverId: session.user.id,
        isRead: false,
      },
    });

    // Count unread messages in threads where user is a participant
    const unreadMessages = await prisma.message.count({
      where: {
        senderId: { not: session.user.id },
        isRead: false,
        inquiry: {
          OR: [
            { senderId: session.user.id },
            { receiverId: session.user.id },
          ],
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        count: unreadInquiries + unreadMessages,
        inquiries: unreadInquiries,
        messages: unreadMessages,
      },
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json(
      { success: true, data: { count: 0 } },
      { status: 200 }
    );
  }
}
