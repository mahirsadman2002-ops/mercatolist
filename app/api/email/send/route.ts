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
    const { to, subject, message, template, listing } = body;

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

    // Send via Resend — use listing-share template if listing data is provided
    try {
      const { sendEmail } = await import("@/lib/email");
      const senderName = session.user.name || "A MercatoList user";

      let emailReact;
      if (template === "listing-share" && listing) {
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
