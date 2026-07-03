import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export type ManagedUserInput = {
  email?: string;
  name?: string;
  phone?: string;
  accountType?: "SELLER" | "ADVISOR";
  brokerageName?: string;
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

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Upgrade an existing plain user to advisor if requested; never downgrade.
    if (role === "BROKER" && existing.role === "USER") {
      const upgraded = await prisma.user.update({
        where: { id: existing.id },
        data: { role: "BROKER", brokerageName: brokerageName ?? existing.brokerageName },
      });
      return { ok: true, user: upgraded, created: false };
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
      // Auto-verified, no password → unclaimed until they set one.
      emailVerified: new Date(),
      isManaged: true,
    },
  });

  return { ok: true, user, created: true };
}
