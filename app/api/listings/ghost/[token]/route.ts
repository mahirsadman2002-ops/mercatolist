import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { applyAddressPrivacy } from "@/lib/address-privacy";

// Ghost (private, link-only) listing lookup by share token. The web page at
// /listings/ghost/[token] reads Prisma directly; the native app needs the same
// lookup over HTTP. Response shape and privacy rules match GET /api/listings/[id].

interface RouteParams {
  params: Promise<{ token: string }>;
}

const notFound = () =>
  NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 });

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    // A blank token must never match a listing whose shareToken is unset.
    if (!token || token.length < 8) return notFound();

    const listing = await prisma.businessListing.findFirst({
      where: { shareToken: token, isGhostListing: true },
      include: {
        photos: { orderBy: { order: "asc" } },
        listedBy: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
            role: true,
            brokerageName: true,
            brokeragePhone: true,
            phone: true,
            email: true,
          },
        },
        coBrokers: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
            brokerageName: true,
            phone: true,
          },
        },
        _count: { select: { inquiries: true, savedByUsers: true } },
      },
    });
    if (!listing) return notFound();

    const session = await auth();
    const isOwner = session?.user?.id === listing.listedById;
    const isPrivileged = isOwner || session?.user?.role === "ADMIN";

    // Drafts and off-market listings stay private even with the link.
    const PUBLIC_STATUSES = ["ACTIVE", "UNDER_CONTRACT", "SOLD"];
    if (!isPrivileged && !PUBLIC_STATUSES.includes(listing.status)) return notFound();

    let sanitized: typeof listing = listing;
    if (!isPrivileged) {
      sanitized = applyAddressPrivacy(listing as any);
      if (sanitized.listedBy) {
        sanitized.listedBy.email = "";
        if (!listing.showPhoneNumber) {
          sanitized.listedBy.phone = null;
          sanitized.listedBy.brokeragePhone = null;
        }
      }
      if (!listing.showPhoneNumber && Array.isArray(sanitized.coBrokers)) {
        sanitized.coBrokers = sanitized.coBrokers.map((cb) => ({ ...cb, phone: null }));
      }
    }

    return NextResponse.json({ success: true, data: { ...sanitized, isSaved: false } });
  } catch (error) {
    console.error("Error fetching ghost listing:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}
