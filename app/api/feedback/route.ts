import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { feedbackSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import FeedbackNotification from "@/emails/feedback-notification";

export async function POST(request: NextRequest) {
  // Open to everyone (logged in or not), so cap abuse by IP.
  const limit = await rateLimit(request, "feedback");
  if (!limit.success) {
    return NextResponse.json(
      { success: false, error: "Too many submissions. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  try {
    const body = await request.json();
    const validated = feedbackSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const { type, message, email, phone, pageUrl } = validated.data;

    // Attach the user if they happen to be signed in (optional).
    const session = await auth();
    const userId = session?.user?.id ?? null;
    const submitterEmail = email || session?.user?.email || "";
    const userAgent = request.headers.get("user-agent") ?? null;

    const feedback = await prisma.feedback.create({
      data: {
        type,
        message,
        email: submitterEmail || null,
        phone: phone || null,
        pageUrl: pageUrl || null,
        userAgent,
        userId,
      },
    });

    // Notify the admin inbox. Never fail the request if the email bounces —
    // the row is already saved and visible in the dashboard.
    try {
      const adminEmail = process.env.ADMIN_EMAIL || "admin@mercatolist.com";
      await sendEmail({
        to: adminEmail,
        subject: `New ${type === "IDEA" ? "idea" : "bug report"} — MercatoList`,
        react: FeedbackNotification({
          type,
          message,
          email: submitterEmail || "anonymous",
          phone: phone || "",
          pageUrl: pageUrl || "—",
          submittedBy: session?.user?.name || "Anonymous visitor",
        }),
      });
    } catch (emailError) {
      console.error("Failed to send feedback notification email:", emailError);
    }

    return NextResponse.json({ success: true, data: { id: feedback.id } }, { status: 201 });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
