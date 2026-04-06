import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

// PUT: Verify a license (admin only)
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const { id } = await params;

    const existing = await prisma.license.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "License not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.license.update({
      where: { id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/admin/licenses/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify license" },
      { status: 500 }
    );
  }
}

// DELETE: Reject/delete a license (admin only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const { id } = await params;

    const existing = await prisma.license.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "License not found" },
        { status: 404 }
      );
    }

    await prisma.license.delete({ where: { id } });

    // Check if user still has any licenses and update flag
    const remainingCount = await prisma.license.count({
      where: { userId: existing.userId },
    });

    if (remainingCount === 0) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { hasLicenses: false },
      });
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error("DELETE /api/admin/licenses/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete license" },
      { status: 500 }
    );
  }
}
