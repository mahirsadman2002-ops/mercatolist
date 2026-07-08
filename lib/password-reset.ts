import crypto from "crypto";

/**
 * Stateless, single-use password-reset tokens (no DB table needed).
 *
 * The token is an HMAC over the user id, an expiry, AND the user's CURRENT
 * password hash. Because the hash is part of the signature, the moment the
 * password is changed the token stops verifying — so a reset link can only be
 * used once, and old links die automatically. Links also expire after 1 hour.
 */
const TTL_MS = 60 * 60 * 1000; // 1 hour

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is not set — cannot sign reset tokens");
  return s;
}

function sign(userId: string, exp: number, passwordHash: string | null): string {
  return crypto
    .createHmac("sha256", secret())
    .update(`reset:${userId}:${exp}:${passwordHash ?? ""}`)
    .digest("hex");
}

export function makeResetToken(
  userId: string,
  passwordHash: string | null
): { exp: number; sig: string } {
  const exp = Date.now() + TTL_MS;
  return { exp, sig: sign(userId, exp, passwordHash) };
}

export function verifyResetToken(
  userId: string,
  exp: number,
  sig: string,
  passwordHash: string | null
): boolean {
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  let expected: string;
  try {
    expected = sign(userId, exp, passwordHash);
  } catch {
    return false;
  }
  const a = Buffer.from(sig || "", "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function resetUrl(userId: string, exp: number, sig: string): string {
  const base = (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://mercatolist.com"
  ).replace(/\/$/, "");
  return `${base}/reset-password?uid=${userId}&exp=${exp}&sig=${sig}`;
}
