import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateProfileCompleteness } from "@/lib/profile-completeness";

// GET: List licenses for the current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const licenses = await prisma.license.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: licenses });
  } catch (error) {
    console.error("GET /api/licenses error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch licenses" },
      { status: 500 }
    );
  }
}

// POST: Create a new license for the current user
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, issuingAuthority, licenseNumber, expirationDate, documentUrl } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "License name is required" },
        { status: 400 }
      );
    }

    const license = await prisma.license.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        issuingAuthority: issuingAuthority?.trim() || null,
        licenseNumber: licenseNumber?.trim() || null,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        documentUrl: documentUrl?.trim() || null,
      },
    });

    // Update user's hasLicenses flag and recalculate profile completeness
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { hasLicenses: true },
    });

    const completeness = calculateProfileCompleteness(user);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { profileCompleteness: completeness },
    });

    return NextResponse.json({ success: true, data: license }, { status: 201 });
  } catch (error) {
    console.error("POST /api/licenses error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create license" },
      { status: 500 }
    );
  }
}
