import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { profileUpdateSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        phone: true,
        role: true,
        ownedBusiness: true,
        buyBox: true,
        brokerageName: true,
        brokerageWebsite: true,
        brokeragePhone: true,
        instagramUrl: true,
        linkedinUrl: true,
        twitterUrl: true,
        facebookUrl: true,
        tiktokUrl: true,
        createdAt: true,
        hashedPassword: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Don't send the hashed password, just whether they have one
    const { hashedPassword, ...userData } = user;
    return NextResponse.json({
      success: true,
      data: { ...userData, hasPassword: !!hashedPassword },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

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
    const validated = profileUpdateSchema.parse(body);

    // Clean up empty strings to null
    const cleanData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(validated)) {
      if (value === "") {
        cleanData[key] = null;
      } else {
        cleanData[key] = value;
      }
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: cleanData,
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        phone: true,
        role: true,
        ownedBusiness: true,
        buyBox: true,
        brokerageName: true,
        brokerageWebsite: true,
        brokeragePhone: true,
        instagramUrl: true,
        linkedinUrl: true,
        twitterUrl: true,
        facebookUrl: true,
        tiktokUrl: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
