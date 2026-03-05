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

    const { accountType } = await request.json();

    if (!accountType || !["USER", "BROKER"].includes(accountType)) {
      return NextResponse.json(
        { success: false, error: "Invalid account type" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { role: accountType },
      select: { id: true, role: true },
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Account type update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update account type" },
      { status: 500 }
    );
  }
}
