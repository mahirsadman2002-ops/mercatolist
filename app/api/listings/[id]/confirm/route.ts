import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// GET /api/listings/[id]/confirm?token=xxx
// One-click confirmation endpoint — no auth required, HMAC-signed token validation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing confirmation token" },
        { status: 400 }
      );
    }

    // Verify HMAC token
    const secret = process.env.NEXTAUTH_SECRET || "";
    const expectedToken = crypto
      .createHmac("sha256", secret)
      .update(id)
      .digest("hex");

    if (token !== expectedToken) {
      return NextResponse.json(
        { success: false, error: "Invalid confirmation token" },
        { status: 403 }
      );
    }

    // Find the listing
    const listing = await prisma.businessListing.findUnique({
      where: { id },
      select: { id: true, title: true, status: true, listedById: true },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const nextDue = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Update confirmation timestamps
    await prisma.businessListing.update({
      where: { id },
      data: {
        lastStatusConfirmation: now,
        statusConfirmationDue: nextDue,
      },
    });

    // Create status log
    await prisma.listingStatusLog.create({
      data: {
        listingId: id,
        confirmedById: listing.listedById,
        previousStatus: listing.status,
        confirmedStatus: listing.status,
      },
    });

    // Redirect to a confirmation success page or return HTML
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mercatolist.com";
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Status Confirmed | MercatoList</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f6f9fc; }
            .card { background: white; border-radius: 12px; padding: 48px; text-align: center; max-width: 480px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            h1 { color: #1a1f36; font-size: 24px; margin: 0 0 12px; }
            p { color: #4a5568; font-size: 15px; line-height: 1.6; margin: 0 0 24px; }
            a { display: inline-block; background: #0d9488; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; }
            .check { font-size: 48px; margin-bottom: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="check">&#10003;</div>
            <h1>Status Confirmed!</h1>
            <p>Your listing "<strong>${listing.title}</strong>" has been confirmed as ${listing.status.replace("_", " ").toLowerCase()}. We'll check in again in 7 days.</p>
            <a href="${appUrl}/my-listings">View My Listings</a>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Confirmation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to confirm listing status" },
      { status: 500 }
    );
  }
}
