import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE: Delete a note from a collection
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, noteId } = await params;

    // Fetch the note and collection ownership
    const note = await prisma.collectionNote.findUnique({
      where: { id: noteId },
      include: {
        collection: {
          select: { userId: true },
        },
      },
    });

    if (!note) {
      return NextResponse.json(
        { success: false, error: "Note not found" },
        { status: 404 }
      );
    }

    // Verify note belongs to this collection
    if (note.collectionId !== id) {
      return NextResponse.json(
        { success: false, error: "Note does not belong to this collection" },
        { status: 404 }
      );
    }

    // Only note author or collection owner can delete
    const isNoteAuthor = note.userId === session.user.id;
    const isCollectionOwner = note.collection.userId === session.user.id;

    if (!isNoteAuthor && !isCollectionOwner) {
      return NextResponse.json(
        { success: false, error: "Only the note author or collection owner can delete this note" },
        { status: 403 }
      );
    }

    await prisma.collectionNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
