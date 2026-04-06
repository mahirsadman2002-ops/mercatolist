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
        { success: false, error: "Sign in to save listings" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify the listing exists
    const listingExists = await prisma.businessListing.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!listingExists) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    // Check if already saved
    const existing = await prisma.savedListing.findUnique({
      where: {
        userId_listingId: { userId: session.user.id, listingId: id },
      },
    });

    if (existing) {
      // Unsave
      await prisma.savedListing.delete({ where: { id: existing.id } });
      const listing = await prisma.businessListing.update({
        where: { id },
        data: { saveCount: { decrement: 1 } },
        select: { saveCount: true },
      });
      return NextResponse.json({
        success: true,
        data: { saved: false, saveCount: listing.saveCount },
      });
    } else {
      // Save
      await prisma.savedListing.create({
        data: { userId: session.user.id, listingId: id },
      });
      const listing = await prisma.businessListing.update({
        where: { id },
        data: { saveCount: { increment: 1 } },
        select: { saveCount: true },
      });
      return NextResponse.json({
        success: true,
        data: { saved: true, saveCount: listing.saveCount },
      });
    }
  } catch (error) {
    console.error("Error saving listing:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save listing" },
      { status: 500 }
    );
  }
}
