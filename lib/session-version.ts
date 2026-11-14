import { createHash } from "crypto";

/**
 * A short fingerprint of the user's current password hash, carried in the
 * session token. When the password changes (change or reset) the fingerprint
 * stops matching and every session issued before the change is rejected — so
 * "I changed my password" really does sign out other devices and anyone who
 * had got hold of a session.
 */
export function passwordFingerprint(hashedPassword: string | null | undefined): string {
  return createHash("sha256").update(hashedPassword ?? "no-password").digest("hex").slice(0, 16);
}
