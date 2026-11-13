import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { reviewFormSchema } from "@/lib/validations";
import { publicReview } from "@/lib/public-review";
import { rateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { requireVerifiedEmail } from "@/lib/require-verified";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10") || 10));
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { brokerId: id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.review.count({ where: { brokerId: id } }),
    ]);

    return NextResponse.json({
      success: true,
      data: reviews.map(publicReview),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "You must be signed in to leave a review" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Can't review yourself
    if (session.user.id === id) {
      return NextResponse.json(
        { success: false, error: "You cannot review yourself" },
        { status: 400 }
      );
    }

    const limit = await rateLimit(request, "write", session.user.id);
    if (!limit.success) return rateLimitResponse(limit.retryAfterSec);

    // Reviews are public and affect an advisor's rating, so the reviewer must
    // have a verified email (same bar as sending an inquiry).
    const gate = await requireVerifiedEmail(session.user.id, "leave a review");
    if (!gate.verified) return gate.response;

    // Check advisor exists (still using role: "BROKER" internally)
    const advisor = await prisma.user.findUnique({
      where: { id, role: "BROKER" },
    });
    if (!advisor) {
      return NextResponse.json(
        { success: false, error: "Advisor not found" },
        { status: 404 }
      );
    }

    // Check if user already reviewed this advisor
    const existingReview = await prisma.review.findFirst({
      where: { reviewerId: session.user.id, brokerId: id },
    });
    if (existingReview) {
      return NextResponse.json(
        { success: false, error: "You have already reviewed this advisor" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = reviewFormSchema.parse({ ...body, brokerId: id });

    const isTransaction =
      validated.experienceType === "BOUGHT" ||
      validated.experienceType === "SOLD";

    const review = await prisma.review.create({
      data: {
        rating: validated.rating,
        text: validated.text || null,
        reviewerId: session.user.id,
        brokerId: id,
        experienceType: validated.experienceType,
        businessCategory: isTransaction
          ? validated.businessCategory || null
          : null,
        businessName: isTransaction
          ? validated.businessName || null
          : null,
        businessAddress: isTransaction
          ? validated.businessAddress || null
          : null,
        transactionYear: isTransaction
          ? validated.transactionYear ?? null
          : null,
        transactionPrice: isTransaction
          ? validated.transactionPrice ?? null
          : null,
        // Queue for admin verification only if there's something verifiable
        transactionStatus:
          isTransaction && validated.businessCategory ? "PENDING" : null,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: review },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    console.error("Error creating review:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create review" },
      { status: 500 }
    );
  }
}
