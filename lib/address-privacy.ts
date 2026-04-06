/**
 * Address privacy utilities for listings with hideAddress=true.
 * Uses a seeded random offset based on listing ID so the circle
 * doesn't jump around on page refreshes.
 */

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  // Convert to 0-1 range
  return Math.abs(Math.sin(hash)) % 1;
}

/**
 * Apply address privacy to a listing object.
 * - Nullifies the address field
 * - Offsets lat/lng by ~0.005 degrees (~0.5 miles) in a consistent direction
 * - Only keeps neighborhood and borough for location text
 */
export function applyAddressPrivacy<T extends {
  id: string;
  hideAddress: boolean;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}>(listing: T): T {
  if (!listing.hideAddress) return listing;

  const rand1 = seededRandom(listing.id + "lat");
  const rand2 = seededRandom(listing.id + "lng");

  // Offset by 0.002-0.005 degrees in a random direction
  const latOffset = (rand1 * 0.003 + 0.002) * (rand1 > 0.5 ? 1 : -1);
  const lngOffset = (rand2 * 0.003 + 0.002) * (rand2 > 0.5 ? 1 : -1);

  return {
    ...listing,
    address: null,
    latitude: listing.latitude != null ? Number(listing.latitude) + latOffset : null,
    longitude: listing.longitude != null ? Number(listing.longitude) + lngOffset : null,
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
