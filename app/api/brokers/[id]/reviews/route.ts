import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { reviewFormSchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
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
      data: reviews,
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

    // Check broker exists
    const broker = await prisma.user.findUnique({
      where: { id, role: "BROKER" },
    });
    if (!broker) {
      return NextResponse.json(
        { success: false, error: "Broker not found" },
        { status: 404 }
      );
    }

    // Check if user already reviewed this broker
    const existingReview = await prisma.review.findFirst({
      where: { reviewerId: session.user.id, brokerId: id },
    });
    if (existingReview) {
      return NextResponse.json(
        { success: false, error: "You have already reviewed this broker" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = reviewFormSchema.parse({ ...body, brokerId: id });

    const review = await prisma.review.create({
      data: {
        rating: validated.rating,
        text: validated.text,
        reviewerId: session.user.id,
        brokerId: id,
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
