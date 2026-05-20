import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import CollectionAccessRequested from "@/emails/collection-access-requested";

const RATE_LIMIT_MS = 24 * 60 * 60 * 1000;

// POST: Request access to a collection (or refresh an existing request).
// Rate-limited to once per 24h per (collection, user).
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "You must be signed in to request access" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, displayName: true, email: true },
        },
        collaborators: { select: { userId: true } },
      },
    });
    if (!collection) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 },
      );
    }

    // Already has access
    if (collection.userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: "You already own this collection" },
        { status: 400 },
      );
    }
    if (collection.collaborators.some((c) => c.userId === session.user.id)) {
      return NextResponse.json(
        { success: false, error: "You already have access" },
        { status: 400 },
      );
    }

    const existing = await prisma.collectionAccessRequest.findUnique({
      where: {
        collectionId_userId: { collectionId: id, userId: session.user.id },
      },
    });

    const now = new Date();
    if (existing) {
      if (existing.status === "APPROVED") {
        return NextResponse.json(
          { success: false, error: "Your request was already approved" },
          { status: 400 },
        );
      }
      const sinceLast = now.getTime() - existing.lastRequestedAt.getTime();
      if (sinceLast < RATE_LIMIT_MS) {
        const hoursRemaining = Math.ceil(
          (RATE_LIMIT_MS - sinceLast) / (60 * 60 * 1000),
        );
        return NextResponse.json(
          {
            success: false,
            error: `You can request access again in ${hoursRemaining}h.`,
          },
          { status: 429 },
        );
      }
      await prisma.collectionAccessRequest.update({
        where: { id: existing.id },
        data: {
          status: "PENDING",
          lastRequestedAt: now,
        },
      });
    } else {
      await prisma.collectionAccessRequest.create({
        data: {
          collectionId: id,
          userId: session.user.id,
          status: "PENDING",
          requestedAt: now,
          lastRequestedAt: now,
        },
      });
    }

    // Notify the owner
    const requester = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, displayName: true, email: true },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "https://mercatolist.com";
    try {
      await sendEmail({
        to: collection.user.email,
        subject: `${requester?.displayName || requester?.name} requested access to "${collection.name}"`,
        react: CollectionAccessRequested({
          requesterName:
            requester?.displayName || requester?.name || "A MercatoList user",
          requesterEmail: requester?.email || "",
          collectionName: collection.name,
          reviewUrl: `${baseUrl}/collections/${id}`,
        }),
      });
    } catch (emailError) {
      console.error("Failed to send access-request email:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to create access request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to request access" },
      { status: 500 },
    );
  }
}
