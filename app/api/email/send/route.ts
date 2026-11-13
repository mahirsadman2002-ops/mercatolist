import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { requireVerifiedEmail } from "@/lib/require-verified";

// Length caps: this endpoint sends MercatoList-branded email, so bound the
// attacker-controllable fields to keep it a "share a listing" tool rather than
// a general-purpose branded relay.
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 2000;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Require a verified sender. Sending branded email from our domain to
    // arbitrary recipients is a phishing/spam vector; a verified email raises
    // the bar and gives accountability for abuse.
    const verified = await requireVerifiedEmail(session.user.id, "send email");
    if (!verified.verified) return verified.response;

    // This route emails an arbitrary recipient — throttle hard per user so it
    // can't be turned into a spam relay / email-bomb tool.
    const limit = await rateLimit(request, "emailSend", session.user.id);
    if (!limit.success) return rateLimitResponse(limit.retryAfterSec);

    const body = await request.json();
    const { to, subject, message, template, listing } = body;

    if (!to || !subject || !message) {
      return NextResponse.json(
        { success: false, error: "to, subject, and message are required" },
        { status: 400 }
      );
    }

    if (
      typeof subject !== "string" ||
      typeof message !== "string" ||
      subject.length > MAX_SUBJECT ||
      message.length > MAX_MESSAGE
    ) {
      return NextResponse.json(
        { success: false, error: "Subject or message too long" },
        { status: 400 }
      );
    }

    // Validate email
    if (typeof to !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Send via Resend — use listing-share template if listing data is provided
    try {
      const { sendEmail } = await import("@/lib/email");
      const senderName = session.user.name || "A MercatoList user";

      let emailReact;
      if (template === "listing-share" && listing) {
        // The email is sent from MercatoList's address with MercatoList
        // branding, so its button and image may only point at MercatoList —
        // never at a link the sender supplies.
        const SITE_HOSTS = ["mercatolist.com", "www.mercatolist.com"];
        // Keep only the listing path from whatever URL the client sent and
        // rebuild the link on the canonical domain.
        const onSite = (value: unknown): string | null => {
          if (typeof value !== "string") return null;
          try {
            const u = new URL(value);
            if (!/^\/listings\/[A-Za-z0-9\-_/]+$/.test(u.pathname)) return null;
            const token = u.searchParams.get("token");
            return `https://mercatolist.com${u.pathname}${
              token ? `?token=${encodeURIComponent(token)}` : ""
            }`;
          } catch {
            return null;
          }
        };
        const httpsImage = (value: unknown): string | undefined => {
          if (typeof value !== "string") return undefined;
          try {
            const u = new URL(value);
            const allowed =
              SITE_HOSTS.includes(u.hostname) ||
              u.hostname.endsWith(".cloudfront.net") ||
              u.hostname.endsWith(".amazonaws.com");
            return u.protocol === "https:" && allowed ? u.toString() : undefined;
          } catch {
            return undefined;
          }
        };
        const text = (value: unknown, max: number) =>
          typeof value === "string" ? value.slice(0, max) : "";
        const safeUrl = onSite(listing.url);
        if (!safeUrl) {
          return NextResponse.json(
            { success: false, error: "Invalid listing link" },
            { status: 400 }
          );
        }
        listing.url = safeUrl;
        listing.photoUrl = httpsImage(listing.photoUrl);
        listing.title = text(listing.title, 200);
        listing.price = text(listing.price, 40);
        listing.category = text(listing.category, 80);
        listing.neighborhood = text(listing.neighborhood, 80);
        listing.borough = text(listing.borough, 40);
        const ListingShareEmail = (await import("@/emails/listing-share")).default;
        emailReact = ListingShareEmail({
          senderName,
          listingTitle: listing.title || "Business Listing",
          listingPrice: listing.price || "",
          listingCategory: listing.category || "",
          listingNeighborhood: listing.neighborhood || "",
          listingBorough: listing.borough || "",
          listingPhotoUrl: listing.photoUrl || undefined,
          listingUrl: listing.url || "https://mercatolist.com",
          personalMessage: message || undefined,
        });
      } else {
        const GenericEmail = (await import("@/emails/generic-email")).default;
        emailReact = GenericEmail({
          senderName,
          subject,
          message,
        });
      }

      await sendEmail({ to, subject, react: emailReact });

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
