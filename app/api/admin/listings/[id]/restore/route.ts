import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

// POST: Restore a soft-deleted listing (admin only). Uses updateMany so it can
// target a row the global read filter hides from findUnique — it flips
// deletedAt back to null only if the listing is actually deleted.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminAuth = await requireAdmin();
    if (!adminAuth.authorized) return adminAuth.response;

    const { id } = await params;

    const result = await prisma.businessListing.updateMany({
      where: { id, deletedAt: { not: null } },
      data: { deletedAt: null },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { success: false, error: "No deleted listing found to restore" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("Admin listing restore error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to restore listing" },
      { status: 500 }
    );
  }
}
