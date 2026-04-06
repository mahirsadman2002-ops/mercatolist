import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateProfileCompleteness } from "@/lib/profile-completeness";

// PUT: Update a license (only if owned by current user)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = await prisma.license.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "License not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, issuingAuthority, licenseNumber, expirationDate, documentUrl } = body;

    const updated = await prisma.license.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(issuingAuthority !== undefined && {
          issuingAuthority: issuingAuthority?.trim() || null,
        }),
        ...(licenseNumber !== undefined && {
          licenseNumber: licenseNumber?.trim() || null,
        }),
        ...(expirationDate !== undefined && {
          expirationDate: expirationDate ? new Date(expirationDate) : null,
        }),
        ...(documentUrl !== undefined && {
          documentUrl: documentUrl?.trim() || null,
        }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/licenses/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update license" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a license (only if owned by current user)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = await prisma.license.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "License not found" },
        { status: 404 }
      );
    }

    await prisma.license.delete({ where: { id } });

    // Check if user still has any licenses
    const remainingCount = await prisma.license.count({
      where: { userId: session.user.id },
    });

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { hasLicenses: remainingCount > 0 },
    });

    const completeness = calculateProfileCompleteness(user);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { profileCompleteness: completeness },
    });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error("DELETE /api/licenses/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete license" },
      { status: 500 }
    );
  }
}
