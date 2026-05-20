import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import CollectionAccessGranted from "@/emails/collection-access-granted";

// PATCH: approve or deny an access request (owner only).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id, requestId } = await params;
    const body = await request.json();
    const { decision } = body;
    if (!["APPROVED", "DENIED"].includes(decision)) {
      return NextResponse.json(
        { success: false, error: "Decision must be APPROVED or DENIED" },
        { status: 400 },
      );
    }

    const collection = await prisma.collection.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        name: true,
        user: { select: { name: true, displayName: true } },
      },
    });
    if (!collection) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 },
      );
    }
    if (collection.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Only the owner can act on requests" },
        { status: 403 },
      );
    }

    const accessReq = await prisma.collectionAccessRequest.findUnique({
      where: { id: requestId },
      include: {
        user: { select: { id: true, name: true, displayName: true, email: true } },
      },
    });
    if (!accessReq || accessReq.collectionId !== id) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 },
      );
    }
    if (accessReq.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "Request already decided" },
        { status: 400 },
      );
    }

    const updated = await prisma.collectionAccessRequest.update({
      where: { id: requestId },
      data: {
        status: decision,
        decidedAt: new Date(),
        decidedById: session.user.id,
      },
    });

    if (decision === "APPROVED") {
      // Create collaborator row (idempotent)
      await prisma.collectionCollaborator.upsert({
        where: {
          collectionId_userId: {
            collectionId: id,
            userId: accessReq.userId,
          },
        },
        update: {},
        create: {
          collectionId: id,
          userId: accessReq.userId,
          role: "viewer",
          invitedBy: session.user.id,
          acceptedAt: new Date(),
        },
      });

      // Notify the requester
      const baseUrl = process.env.NEXTAUTH_URL || "https://mercatolist.com";
      try {
        await sendEmail({
          to: accessReq.user.email,
          subject: `Your request to access "${collection.name}" was approved`,
          react: CollectionAccessGranted({
            recipientName:
              accessReq.user.displayName || accessReq.user.name || "there",
            ownerName:
              collection.user.displayName ||
              collection.user.name ||
              "the owner",
            collectionName: collection.name,
            collectionUrl: `${baseUrl}/collections/${id}`,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send access-granted email:", emailError);
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to decide access request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update request" },
      { status: 500 },
    );
  }
}
