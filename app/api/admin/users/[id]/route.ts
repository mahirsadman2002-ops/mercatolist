import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

// PATCH: admin edits limited user fields (currently the profile photo, e.g.
// setting an avatar on a broker's behalf).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const data: { avatarUrl?: string | null } = {};

    if ("avatarUrl" in body) {
      const url = body.avatarUrl;
      // Allow clearing (null/empty) or an https URL from our own storage/CDN.
      if (url == null || url === "") {
        data.avatarUrl = null;
      } else if (typeof url === "string" && /^https:\/\//.test(url)) {
        data.avatarUrl = url;
      } else {
        return NextResponse.json(
          { success: false, error: "Invalid avatar URL." },
          { status: 400 }
        );
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, error: "Nothing to update." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, avatarUrl: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const { id } = await params;

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { message: "User deleted successfully" },
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
