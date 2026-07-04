import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export type ManagedUserInput = {
  email?: string;
  name?: string;
  phone?: string;
  accountType?: "SELLER" | "ADVISOR";
  brokerageName?: string;
  /** Already-hosted (S3/CDN) avatar URL to set if the account has none yet. */
  avatarUrl?: string;
};

export type FindOrCreateResult =
  | { ok: true; user: User; created: boolean }
  | { ok: false; status: number; error: string };

/**
 * Find-or-create a "managed" account on someone's behalf — the shared primitive
 * behind both the admin "Create user" flow and createListingForSeller.
 *
 * A managed account is auto-verified and has NO password, so it's "unclaimed"
 * until the person sets one via the claim email (see lib/claim.ts). This lets
 * an admin stand up an account for a seller/advisor before they've signed up.
 *
 * Behavior for an existing email:
 *  - already a managed/unclaimed account → returned as-is (created:false), so
 *    the caller can re-send the claim link.
 *  - an existing USER upgraded to ADVISOR → role bumped to BROKER.
 * Does NOT send the claim email — callers send it with their own reason.
 */
export async function findOrCreateManagedUser(
  input: ManagedUserInput
): Promise<FindOrCreateResult> {
  const email = String(input.email || "").trim().toLowerCase();
  const name = String(input.name || "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 400, error: "A valid email is required." };
  }
  if (!name) {
    return { ok: false, status: 400, error: "A name is required." };
  }

  const role = input.accountType === "ADVISOR" ? "BROKER" : "USER";
  const brokerageName =
    role === "BROKER" && input.brokerageName
      ? String(input.brokerageName).trim()
      : null;
  const phone = input.phone ? String(input.phone).trim() : null;
  const avatarUrl =
    typeof input.avatarUrl === "string" && /^https:\/\//.test(input.avatarUrl)
      ? input.avatarUrl
      : undefined;

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Set the avatar only if they don't already have one (never clobber a
    // photo they set themselves); upgrade a plain user to advisor if asked.
    const data: {
      role?: "BROKER";
      brokerageName?: string | null;
      avatarUrl?: string;
    } = {};
    if (role === "BROKER" && existing.role === "USER") {
      data.role = "BROKER";
      data.brokerageName = brokerageName ?? existing.brokerageName;
    }
    if (avatarUrl && !existing.avatarUrl) data.avatarUrl = avatarUrl;

    if (Object.keys(data).length > 0) {
      const updated = await prisma.user.update({ where: { id: existing.id }, data });
      return { ok: true, user: updated, created: false };
    }
    return { ok: true, user: existing, created: false };
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      phone,
      role,
      brokerageName,
      avatarUrl,
      // Auto-verified, no password → unclaimed until they set one.
      emailVerified: new Date(),
      isManaged: true,
    },
  });

  return { ok: true, user, created: true };
}
