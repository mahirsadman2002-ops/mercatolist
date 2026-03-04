import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if already saved
    const existing = await prisma.savedListing.findUnique({
      where: {
        userId_listingId: { userId: session.user.id, listingId: id },
      },
    });

    if (existing) {
      // Unsave
      await prisma.savedListing.delete({ where: { id: existing.id } });
      await prisma.businessListing.update({
        where: { id },
        data: { saveCount: { decrement: 1 } },
      });
      return NextResponse.json({ success: true, data: { saved: false } });
    } else {
      // Save
      await prisma.savedListing.create({
        data: { userId: session.user.id, listingId: id },
      });
      await prisma.businessListing.update({
        where: { id },
        data: { saveCount: { increment: 1 } },
      });
      return NextResponse.json({ success: true, data: { saved: true } });
    }
  } catch (error) {
    console.error("Error saving listing:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save listing" },
      { status: 500 }
    );
  }
}
