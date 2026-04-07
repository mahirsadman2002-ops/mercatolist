import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { to, subject, message, replyTo } = body;

    if (!to || !subject || !message) {
      return NextResponse.json(
        { success: false, error: "to, subject, and message are required" },
        { status: 400 }
      );
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Send via Resend
    try {
      const { sendEmail } = await import("@/lib/email");
      const GenericEmail = (await import("@/emails/generic-email")).default;

      await sendEmail({
        to,
        subject,
        react: GenericEmail({
          senderName: session.user.name || "A MercatoList user",
          subject,
          message,
          replyTo: replyTo || session.user.email || undefined,
        }),
      });

      return NextResponse.json({ success: true });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      return NextResponse.json(
        { success: false, error: "Failed to send email. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}
