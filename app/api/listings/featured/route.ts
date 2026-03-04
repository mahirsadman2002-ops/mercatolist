import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const listings = await prisma.businessListing.findMany({
      where: { status: "ACTIVE", isGhostListing: false },
      orderBy: { viewCount: "desc" },
      take: 6,
      include: {
        photos: { orderBy: { order: "asc" }, take: 1 },
        listedBy: {
          select: {
            id: true,
            name: true,
            displayName: true,
            role: true,
            brokerageName: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: listings });
  } catch (error) {
    console.error("Error fetching featured listings:", error);
    return NextResponse.json({ success: true, data: [] });
  }
}
