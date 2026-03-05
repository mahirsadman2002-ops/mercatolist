import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { role, phone, bio, brokerageName, brokerageWebsite, brokeragePhone,
      linkedinUrl, instagramUrl, twitterUrl, facebookUrl, tiktokUrl } = body;

    const updateData: Record<string, any> = {};

    if (role && (role === "USER" || role === "BROKER")) {
      updateData.role = role;
    }
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;

    // Broker fields
    if (brokerageName !== undefined) updateData.brokerageName = brokerageName;
    if (brokerageWebsite !== undefined) updateData.brokerageWebsite = brokerageWebsite;
    if (brokeragePhone !== undefined) updateData.brokeragePhone = brokeragePhone;
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
    if (instagramUrl !== undefined) updateData.instagramUrl = instagramUrl;
    if (twitterUrl !== undefined) updateData.twitterUrl = twitterUrl;
    if (facebookUrl !== undefined) updateData.facebookUrl = facebookUrl;
    if (tiktokUrl !== undefined) updateData.tiktokUrl = tiktokUrl;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        bio: true,
        brokerageName: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Complete profile error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
