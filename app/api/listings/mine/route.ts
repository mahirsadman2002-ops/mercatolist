import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {
      listedById: session.user.id,
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    const listings = await prisma.businessListing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        photos: { orderBy: { order: "asc" }, take: 1 },
        inquiries: {
          select: {
            id: true,
            isRead: true,
          },
        },
        savedByUsers: {
          select: { id: true },
        },
      },
    });

    const data = listings.map((listing) => ({
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      status: listing.status,
      category: listing.category,
      askingPrice: listing.askingPrice,
      neighborhood: listing.neighborhood,
      borough: listing.borough,
      viewCount: listing.viewCount,
      saveCount: listing.saveCount,
      shareCount: listing.shareCount,
      createdAt: listing.createdAt,
      soldPrice: listing.soldPrice,
      soldDate: listing.soldDate,
      photo: listing.photos[0]?.url || null,
      inquiryCount: listing.inquiries.length,
      unreadInquiries: listing.inquiries.filter((i) => !i.isRead).length,
      savedCount: listing.savedByUsers.length,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching user listings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}
