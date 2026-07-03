import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import ClaimAccount from "@/emails/claim-account";

export type ClaimReason = "created" | "listing" | "reminder" | "inquiry";

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://mercatolist.com").replace(/\/$/, "");
}

/** Stable HMAC over the user id — acts as the claim secret in the link. */
export function claimToken(userId: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  // Fail closed: an empty key would make every claim token forgeable, which is
  // account takeover of managed/unclaimed accounts. Never sign with "".
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not set — cannot sign claim tokens");
  }
  return crypto.createHmac("sha256", secret).update(`claim:${userId}`).digest("hex");
}

export function verifyClaimToken(userId: string, token: string) {
  let expected: string;
  try {
    expected = claimToken(userId);
  } catch {
    return false; // No secret → reject, never accept.
  }
  // Constant-time compare.
  const a = Buffer.from(token || "", "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function claimUrl(userId: string) {
  return `${appUrl()}/claim?uid=${userId}&token=${claimToken(userId)}`;
}

/**
 * Send a claim email to a managed, unclaimed user. Best-effort: never throws,
 * so callers (listing creation, inquiries) aren't broken by an email failure.
 * Returns true if an email was actually sent.
 */
export async function sendClaimEmail(
  user: { id: string; email: string; name: string; isManaged: boolean; claimedAt: Date | null },
  reason: ClaimReason,
  extra?: { listingTitle?: string }
): Promise<boolean> {
  if (!user.isManaged || user.claimedAt) return false;
  try {
    await sendEmail({
      to: user.email,
      subject:
        reason === "inquiry"
          ? "You have a new buyer inquiry — claim your MercatoList account"
          : "Claim your MercatoList account",
      react: ClaimAccount({
        name: user.name,
        claimUrl: claimUrl(user.id),
        reason,
        listingTitle: extra?.listingTitle,
      }),
    });
    return true;
  } catch (e) {
    console.error("Failed to send claim email:", e);
    return false;
  }
}

/** Convenience: load the user and send, used from routes that only have an id. */
export async function sendClaimEmailToUserId(userId: string, reason: ClaimReason, extra?: { listingTitle?: string }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, isManaged: true, claimedAt: true },
  });
  if (!user) return false;
  return sendClaimEmail(user, reason, extra);
}
