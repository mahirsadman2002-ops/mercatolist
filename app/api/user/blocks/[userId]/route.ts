import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// DELETE: unblock a user.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = await params;
  await prisma.userBlock.deleteMany({
    where: { blockerId: session.user.id, blockedId: userId },
  });
  return NextResponse.json({ success: true, data: { blocked: false } });
}
