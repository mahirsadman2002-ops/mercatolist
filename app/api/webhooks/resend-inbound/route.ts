import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { parseReplyBody, isAutoReply, generateReplyToAddress } from "@/lib/email-reply";
import NewMessage from "@/emails/new-message";

/**
 * Resend inbound email webhook.
 *
 * Receives POST requests when an email arrives at a reply+{threadId}@inbound.mercatolist.com
 * address. Parses the reply, adds it to the correct conversation thread, and
 * notifies the other party.
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: verify webhook secret
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret) {
      const svixId = request.headers.get("svix-id");
      const svixSignature = request.headers.get("svix-signature");
      if (!svixId || !svixSignature) {
        console.warn("[inbound-webhook] Missing webhook signature headers");
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
      // For full verification you would use the svix library here.
      // For now we just check that headers are present when a secret is configured.
    }

    const payload = await request.json();

    // Resend sends { type, data }
    if (payload.type !== "email.received") {
      return NextResponse.json({ success: true, data: { skipped: true, reason: "not email.received" } });
    }

    const data = payload.data;
    const fromEmail: string = data.from;
    const toAddresses: string[] = Array.isArray(data.to) ? data.to : [data.to];
    const subject: string = data.subject || "";
    const textBody: string = data.text || "";

    // Detect auto-replies
    if (isAutoReply(subject, textBody)) {
      console.log("[inbound-webhook] Skipping auto-reply from", fromEmail);
      return NextResponse.json({ success: true, data: { skipped: true, reason: "auto-reply" } });
    }

    // Extract thread ID from the to address: reply+{threadId}@...
    let threadId: string | null = null;
    for (const addr of toAddresses) {
      const match = addr.match(/reply\+([^@]+)@/i);
      if (match) {
        threadId = match[1];
        break;
      }
    }

    if (!threadId) {
      console.warn("[inbound-webhook] No thread ID found in to addresses:", toAddresses);
      return NextResponse.json({ success: true, data: { skipped: true, reason: "no-thread-id" } });
    }

    // Parse the reply body
    const replyContent = parseReplyBody(textBody);
    if (!replyContent) {
      console.log("[inbound-webhook] Empty reply body from", fromEmail);
      return NextResponse.json({ success: true, data: { skipped: true, reason: "empty-body" } });
    }

    // Find the inquiry thread
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: threadId },
      include: {
        listing: {
          select: { title: true },
        },
        sender: {
          select: { id: true, email: true, name: true },
        },
        receiver: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!inquiry) {
      console.warn("[inbound-webhook] Inquiry not found for thread ID:", threadId);
      return NextResponse.json({ success: true, data: { skipped: true, reason: "unknown-thread" } });
    }

    // Find the user by their from email address
    // Resend may send just an email or "Name <email>" format
    const cleanEmail = fromEmail.includes("<")
      ? fromEmail.match(/<([^>]+)>/)?.[1] || fromEmail
      : fromEmail;

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail.toLowerCase().trim() },
      select: { id: true, name: true },
    });

    if (!user) {
      console.warn("[inbound-webhook] Unknown sender email:", cleanEmail);
      return NextResponse.json({ success: true, data: { skipped: true, reason: "unknown-sender" } });
    }

    // Verify the user is a participant in this thread
    if (user.id !== inquiry.senderId && user.id !== inquiry.receiverId) {
      console.warn("[inbound-webhook] User not a participant in thread:", user.id, threadId);
      return NextResponse.json({ success: true, data: { skipped: true, reason: "not-participant" } });
    }

    // Create the message
    await prisma.message.create({
      data: {
        content: replyContent,
        inquiryId: threadId,
        senderId: user.id,
      },
    });

    // Mark inquiry as unread for the other party
    await prisma.inquiry.update({
      where: { id: threadId },
      data: { isRead: false },
    });

    // Send notification email to the other party (non-blocking)
    const recipient =
      user.id === inquiry.senderId ? inquiry.receiver : inquiry.sender;

    if (recipient?.email) {
      const baseUrl = process.env.NEXTAUTH_URL || "https://mercatolist.com";
      try {
        await sendEmail({
          to: recipient.email,
          subject: `New message about ${inquiry.listing.title}`,
          replyTo: generateReplyToAddress(inquiry.id),
          react: NewMessage({
            senderName: user.name || "Someone",
            listingTitle: inquiry.listing.title,
            messagePreview:
              replyContent.length > 200
                ? replyContent.slice(0, 200) + "..."
                : replyContent,
            threadUrl: `${baseUrl}/inquiries`,
          }),
        });
      } catch (e) {
        console.error("[inbound-webhook] Failed to send notification email:", e);
      }
    }

    return NextResponse.json({ success: true, data: { messageCreated: true } });
  } catch (error) {
    console.error("[inbound-webhook] Error processing inbound email:", error);
    // Return 200 to prevent Resend from retrying
    return NextResponse.json({ success: false, error: "Internal error" });
  }
}
