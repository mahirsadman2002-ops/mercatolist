import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import StatusConfirmationRequest from "@/emails/status-confirmation-request";

// How long owners have between status confirmations.
export const CONFIRMATION_INTERVAL_DAYS = 30;

type ConfirmationListing = {
  id: string;
  title: string;
  category: string;
  borough: string;
  askingPrice: unknown;
  listedBy: { name: string; email: string };
};

/**
 * Sends the "is this listing still active?" confirmation email for a listing,
 * then advances statusConfirmationDue and bumps the non-response counters.
 * Shared by the daily cron and the admin "Remind" action so both stay in sync.
 */
export async function sendStatusConfirmationEmail(listing: ConfirmationListing) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mercatolist.com";
  const secret = process.env.NEXTAUTH_SECRET || "";

  // One-click confirm link, HMAC-signed so no login is required.
  const token = crypto
    .createHmac("sha256", secret)
    .update(listing.id)
    .digest("hex");

  const confirmUrl = `${appUrl}/api/listings/${listing.id}/confirm?token=${token}`;
  const updateUrl = `${appUrl}/my-listings`;

  await sendEmail({
    to: listing.listedBy.email,
    subject: `Is "${listing.title}" still active? — MercatoList`,
    react: StatusConfirmationRequest({
      listingTitle: listing.title,
      listingCategory: listing.category,
      listingBorough: listing.borough.replace("_", " "),
      askingPrice: `$${Number(listing.askingPrice).toLocaleString()}`,
      confirmUrl,
      updateUrl,
      ownerName: listing.listedBy.name,
    }),
  });

  const now = new Date();
  const nextDue = new Date(
    now.getTime() + CONFIRMATION_INTERVAL_DAYS * 24 * 60 * 60 * 1000
  );

  await prisma.businessListing.update({
    where: { id: listing.id },
    data: {
      statusConfirmationDue: nextDue,
      lastReminderSentAt: now,
      confirmationRemindersSent: { increment: 1 },
    },
  });
}
