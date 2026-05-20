import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { reviewResponseSchema } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id, reviewId } = await params;

    // Only the broker can respond on their own profile
    if (session.user.id !== id) {
      return NextResponse.json(
        {
          success: false,
          error: "You can only respond to reviews on your own profile",
        },
        { status: 403 },
      );
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, brokerId: true, response: true },
    });
    if (!review || review.brokerId !== id) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 },
      );
    }
    if (review.response) {
      return NextResponse.json(
        { success: false, error: "You have already responded to this review" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validated = reviewResponseSchema.parse(body);

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        response: validated.response,
        responseAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error },
        { status: 400 },
      );
    }
    console.error("Error posting review response:", error);
    return NextResponse.json(
      { success: false, error: "Failed to post response" },
      { status: 500 },
    );
  }
}
