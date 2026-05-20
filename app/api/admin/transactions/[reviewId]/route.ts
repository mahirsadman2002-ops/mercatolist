import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { transactionReviewDecisionSchema } from "@/lib/validations";

interface Params {
  params: Promise<{ reviewId: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { reviewId } = await params;
    const body = await request.json();
    const validated = transactionReviewDecisionSchema.parse(body);

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        reviewer: { select: { id: true, name: true } },
        broker: { select: { id: true, name: true } },
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 },
      );
    }

    if (review.transactionStatus !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "Review is not pending verification" },
        { status: 400 },
      );
    }

    if (validated.decision === "REJECTED") {
      const updated = await prisma.review.update({
        where: { id: reviewId },
        data: {
          transactionStatus: "REJECTED",
          transactionReviewedById: auth.userId,
          transactionReviewedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    // APPROVED: record as a verified PastDeal on the broker's profile.
    // Note: PastDeal is the canonical "verified sale" record used on broker profiles.
    // If the admin also wants a full searchable BusinessListing (with geocoded address,
    // photos, etc.), they create that separately from the admin listings UI.
    if (!review.businessCategory) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot approve: review has no business category",
        },
        { status: 400 },
      );
    }

    const pastDeal = await prisma.pastDeal.create({
      data: {
        userId: review.broker.id,
        businessName:
          review.businessName ||
          `${review.businessCategory} (verified sale)`,
        category: review.businessCategory,
        borough: null,
        neighborhood: null,
        salePrice: review.transactionPrice ?? null,
        dateSold: review.transactionYear
          ? new Date(review.transactionYear, 0, 1)
          : null,
        notes: validated.notes
          ? `Admin notes: ${validated.notes}\nReviewer: ${review.reviewer.name}\nReview ID: ${reviewId}`
          : `Verified from review by ${review.reviewer.name}. Review ID: ${reviewId}`,
        isVerified: true,
      },
    });

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        transactionStatus: "APPROVED",
        transactionReviewedById: auth.userId,
        transactionReviewedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: { review: updated, pastDeal },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error },
        { status: 400 },
      );
    }
    console.error("Failed to decide transaction review:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process decision" },
      { status: 500 },
    );
  }
}
