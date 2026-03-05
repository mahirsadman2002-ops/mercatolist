import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { adminUserBanSchema } from "@/lib/validations";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const { id } = await params;
    const body = await request.json();
    const validated = adminUserBanSchema.parse(body);

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

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isBanned: true,
        bannedReason: validated.bannedReason,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
        bannedReason: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    console.error("Error banning user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to ban user" },
      { status: 500 }
    );
  }
}
