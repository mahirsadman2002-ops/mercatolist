import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { reportFormSchema } from "@/lib/validations";
import { rateLimit, rateLimitResponse } from "@/lib/ratelimit";

// POST: Submit a report (listing, review, deal, or user). Lands in the admin
// reports queue (/admin/reports).
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Please sign in to submit a report" },
        { status: 401 }
      );
    }

    const limit = await rateLimit(request, "write", session.user.id);
    if (!limit.success) return rateLimitResponse(limit.retryAfterSec);

    const parsed = reportFormSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid report" },
        { status: 400 }
      );
    }
    const { type, reason, details, listingId, reviewId, userId } = parsed.data;

    // The report must point at a real target of the stated type.
    let target: { listingId?: string; reviewId?: string; userId?: string } | null = null;
    if ((type === "LISTING" || type === "DEAL") && listingId) {
      const exists = await prisma.businessListing.findUnique({
        where: { id: listingId },
        select: { id: true },
      });
      if (exists) target = { listingId };
    } else if (type === "REVIEW" && reviewId) {
      const exists = await prisma.review.findUnique({
        where: { id: reviewId },
        select: { id: true },
      });
      if (exists) target = { reviewId };
    } else if (type === "USER" && userId && userId !== session.user.id) {
      const exists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (exists) target = { userId };
    }
    if (!target) {
      return NextResponse.json(
        { success: false, error: "Nothing to report was found" },
        { status: 400 }
      );
    }

    // One open report per reporter per target — repeat taps are a no-op.
    const existing = await prisma.report.findFirst({
      where: { reporterId: session.user.id, type, status: "PENDING", ...target },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ success: true, data: { id: existing.id } });
    }

    const report = await prisma.report.create({
      data: { type, reason, details, reporterId: session.user.id, ...target },
      select: { id: true },
    });

    if (target.reviewId) {
      await prisma.review.update({
        where: { id: target.reviewId },
        data: { isReported: true, reportReason: details?.slice(0, 500) || reason },
      });
    }

    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch (error) {
    console.error("Error submitting report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit report" },
      { status: 500 }
    );
  }
}
