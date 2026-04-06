import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "@/lib/email";
import ReviewRequestEmail from "@/emails/review-request";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify user is the broker
    if (session.user.id !== id) {
      return NextResponse.json(
        { success: false, error: "You can only request reviews for your own profile" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const clientEmail = body.clientEmail || null;

    // Create review token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    await prisma.reviewToken.create({
      data: {
        token,
        brokerId: id,
        clientEmail,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "https://mercatolist.com";
    const reviewUrl = `${baseUrl}/advisors/${id}/review?token=${token}`;

    // If client email provided, send email
    if (clientEmail) {
      const broker = await prisma.user.findUnique({
        where: { id },
        select: { name: true, displayName: true, brokerageName: true },
      });

      const brokerName = broker?.displayName || broker?.name || "Your Advisor";

      try {
        await sendEmail({
          to: clientEmail,
          subject: `${brokerName} would like your review on MercatoList`,
          react: ReviewRequestEmail({
            brokerName,
            brokerageName: broker?.brokerageName || undefined,
            reviewUrl,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send review request email:", emailError);
        // Still return success with the URL even if email fails
      }
    }

    return NextResponse.json({
      success: true,
      data: { reviewUrl, token },
    });
  } catch (error) {
    console.error("Error creating review request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create review request" },
      { status: 500 }
    );
  }
}
