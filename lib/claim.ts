import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import ClaimAccount from "@/emails/claim-account";

export type ClaimReason = "created" | "listing" | "reminder" | "inquiry";

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://mercatolist.com").replace(/\/$/, "");
}

// Claim links expire after 7 days. Since the daily claim-reminders cron always
// sends a fresh link, an unclaimed user is never locked out — only stale/leaked
// links die.
const CLAIM_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** HMAC over the user id + expiry — the claim secret in the link. */
function signClaim(userId: string, exp: number): string {
  const secret = process.env.NEXTAUTH_SECRET;
  // Fail closed: an empty key would make every claim token forgeable, which is
  // account takeover of managed/unclaimed accounts. Never sign with "".
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not set — cannot sign claim tokens");
  }
  return crypto.createHmac("sha256", secret).update(`claim:${userId}:${exp}`).digest("hex");
}

export function makeClaimToken(userId: string): { exp: number; sig: string } {
  const exp = Date.now() + CLAIM_TTL_MS;
  return { exp, sig: signClaim(userId, exp) };
}

export function verifyClaimToken(userId: string, exp: number, token: string) {
  if (!Number.isFinite(exp) || exp < Date.now()) return false; // expired/invalid
  let expected: string;
  try {
    expected = signClaim(userId, exp);
  } catch {
    return false; // No secret → reject, never accept.
  }
  // Constant-time compare.
  const a = Buffer.from(token || "", "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function claimUrl(userId: string) {
  const { exp, sig } = makeClaimToken(userId);
  return `${appUrl()}/claim?uid=${userId}&exp=${exp}&token=${sig}`;
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
