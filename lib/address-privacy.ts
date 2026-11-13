import { createHmac } from "crypto";

/**
 * Address privacy utilities for listings with hideAddress=true.
 *
 * The public coordinates are the real ones snapped to a coarse grid and then
 * nudged by an offset derived from a server secret, so the circle stays put
 * across page loads but can't be undone: the listing id alone no longer
 * reproduces the offset, and the snap discards the precise position anyway.
 * Server-only (uses node crypto) — never import from a client component.
 */

// ~0.004° ≈ 440 m north–south, ~340 m east–west at NYC's latitude.
const GRID = 0.004;

function keyedUnit(id: string, axis: string): number {
  const secret =
    process.env.ADDRESS_PRIVACY_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "";
  const digest = createHmac("sha256", secret).update(`${id}:${axis}`).digest();
  return digest.readUInt32BE(0) / 0xffffffff; // 0..1
}

function obscure(value: number, id: string, axis: string): number {
  const snapped = Math.round(value / GRID) * GRID;
  // ±0.0015° keyed jitter so listings in one grid cell don't stack exactly.
  return snapped + (keyedUnit(id, axis) - 0.5) * 0.003;
}

/**
 * Apply address privacy to a listing object.
 * - Nullifies the address field
 * - Offsets lat/lng by ~0.005 degrees (~0.5 miles) in a consistent direction
 * - Only keeps neighborhood and borough for location text
 */
// Admin/ops-only columns that must never appear in a PUBLIC listing payload.
const INTERNAL_LISTING_FIELDS = [
  // The link-only access token for ghost listings; only the owner's own
  // (privileged, un-scrubbed) views may carry it.
  "shareToken",
  "adminNotes",
  "lastStatusConfirmation",
  "statusConfirmationDue",
  "confirmationRemindersSent",
] as const;

/**
 * Remove internal/admin-only fields from a listing before it's returned to a
 * public (non-admin) caller. Safe to call on any listing-shaped object.
 */
export function stripInternalListingFields<T extends Record<string, unknown>>(
  listing: T
): T {
  const clean = { ...listing } as Record<string, unknown>;
  for (const f of INTERNAL_LISTING_FIELDS) delete clean[f];
  return clean as T;
}

export function applyAddressPrivacy<T extends {
  id: string;
  hideAddress: boolean;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}>(listing: T): T {
  // Always drop admin-only fields (adminNotes etc.) from public output —
  // regardless of hideAddress.
  const listingClean = stripInternalListingFields(
    listing as unknown as Record<string, unknown>
  ) as unknown as T;
  if (!listingClean.hideAddress) return listingClean;
  listing = listingClean;

  return {
    ...listing,
    address: null,
    latitude:
      listing.latitude != null ? obscure(Number(listing.latitude), listing.id, "lat") : null,
    longitude:
      listing.longitude != null ? obscure(Number(listing.longitude), listing.id, "lng") : null,
  };
}

/**
 * Apply address privacy to an array of listings.
 */
export function applyAddressPrivacyToList<T extends {
  id: string;
  hideAddress: boolean;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}>(listings: T[]): T[] {
  return listings.map(applyAddressPrivacy);
}
