import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

// GET: List all unverified licenses (admin only)
export async function GET() {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const licenses = await prisma.license.findMany({
      where: { isVerified: false },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: licenses });
  } catch (error) {
    console.error("GET /api/admin/licenses error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch licenses" },
      { status: 500 }
    );
  }
}
