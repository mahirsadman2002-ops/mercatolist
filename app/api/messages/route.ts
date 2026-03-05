import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: Fetch all message threads for the current user
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
    const inquiryId = searchParams.get("inquiryId");

    if (inquiryId) {
      // Fetch messages for a specific inquiry
      const inquiry = await prisma.inquiry.findUnique({
        where: { id: inquiryId },
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
        where: { inquiryId },
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

      return NextResponse.json({ success: true, data: messages });
    }

    // No inquiryId — return recent messages across all user's threads
    const messages = await prisma.message.findMany({
      where: {
        inquiry: {
          OR: [
            { senderId: session.user.id },
            { receiverId: session.user.id },
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        inquiry: {
          select: {
            id: true,
            listing: {
              select: { title: true, slug: true },
            },
          },
        },
      },
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
