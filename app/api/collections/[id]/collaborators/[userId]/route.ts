import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper: require collection owner
async function requireOwner(
  collectionId: string,
  sessionUserId: string,
) {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { id: true, userId: true, name: true },
  });
  if (!collection) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 },
      ),
    };
  }
  if (collection.userId !== sessionUserId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "Only the collection owner can manage collaborators",
        },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, collection };
}

// DELETE: remove a collaborator (owner only).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const { id, userId } = await params;
    const check = await requireOwner(id, session.user.id);
    if (!check.ok) return check.response;

    await prisma.collectionCollaborator.delete({
      where: { collectionId_userId: { collectionId: id, userId } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove collaborator:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove collaborator" },
      { status: 500 },
    );
  }
}

// PATCH: change a collaborator's role (owner only).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const { id, userId } = await params;
    const check = await requireOwner(id, session.user.id);
    if (!check.ok) return check.response;

    const body = await request.json();
    const { role } = body;
    if (!role || !["viewer", "editor"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Role must be 'viewer' or 'editor'" },
        { status: 400 },
      );
    }

    const updated = await prisma.collectionCollaborator.update({
      where: { collectionId_userId: { collectionId: id, userId } },
      data: { role },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update collaborator role:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update collaborator" },
      { status: 500 },
    );
  }
}
