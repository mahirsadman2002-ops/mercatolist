import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        role: true,
        ownedBusiness: true,
        buyBox: true,
        createdAt: true,
        listings: {
          where: { isGhostListing: false },
          orderBy: { createdAt: "desc" },
          take: 12,
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
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Split listings by status
    const activeListings = user.listings.filter(
      (l) => l.status === "ACTIVE"
    );
    const soldListings = user.listings.filter((l) => l.status === "SOLD");
    const underContractListings = user.listings.filter(
      (l) => l.status === "UNDER_CONTRACT"
    );

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.displayName || user.name,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        role: user.role,
        ownedBusiness: user.ownedBusiness,
        buyBox: user.buyBox,
        memberSince: user.createdAt,
        activeListings,
        soldListings,
        underContractListings,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
