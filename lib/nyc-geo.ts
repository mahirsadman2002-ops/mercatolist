/**
 * NYC geo-fencing. MercatoList only lists businesses inside the five boroughs,
 * so this is the single source of truth for "is this location in NYC".
 *
 * Primary signal is the ZIP code (deterministic per borough). Coordinates are a
 * secondary guard against a hand-crafted API request that pairs a fake NYC ZIP
 * with out-of-town coordinates.
 */

export type Borough =
  | "MANHATTAN"
  | "BROOKLYN"
  | "QUEENS"
  | "BRONX"
  | "STATEN_ISLAND";

/** NYC borough from a 5-digit ZIP, or "" if the ZIP isn't in NYC. */
export function boroughFromZip(zip: string): Borough | "" {
  const n = parseInt(String(zip || "").slice(0, 5), 10);
  if (!n) return "";
  if (n >= 10001 && n <= 10282) return "MANHATTAN";
  if (n >= 10301 && n <= 10314) return "STATEN_ISLAND";
  if (n >= 10451 && n <= 10475) return "BRONX";
  if (n >= 11201 && n <= 11256) return "BROOKLYN";
  if ((n >= 11001 && n <= 11109) || (n >= 11351 && n <= 11697)) return "QUEENS";
  return "";
}

/** True if the ZIP falls within one of the five boroughs. */
export function isNycZip(zip: string): boolean {
  return boroughFromZip(zip) !== "";
}

// Generous bounding box covering all five boroughs (and only a thin sliver of
// neighboring areas — the ZIP check handles precision). Coordinates outside
// this box are definitely not NYC.
const NYC_BOUNDS = { minLat: 40.47, maxLat: 40.93, minLng: -74.30, maxLng: -73.68 };

export function isWithinNycBounds(
  lat: number | null | undefined,
  lng: number | null | undefined
): boolean {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }
  return (
    lat >= NYC_BOUNDS.minLat &&
    lat <= NYC_BOUNDS.maxLat &&
    lng >= NYC_BOUNDS.minLng &&
    lng <= NYC_BOUNDS.maxLng
  );
}

/**
 * Validate that a listing's location is inside NYC. Returns { ok } or
 * { ok: false, error } with a user-facing message. Call before publishing /
 * creating a live listing.
 */
export function validateNycLocation(loc: {
  zipCode?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}): { ok: true } | { ok: false; error: string } {
  const zip = String(loc.zipCode || "").trim();
  if (!isNycZip(zip)) {
    return {
      ok: false,
      error:
        "MercatoList only lists businesses in the five NYC boroughs. This ZIP code isn't in New York City.",
    };
  }

  // If coordinates are present, they must also be within NYC — guards against
  // a spoofed ZIP paired with out-of-town coordinates.
  const lat = loc.latitude == null || loc.latitude === "" ? null : Number(loc.latitude);
  const lng = loc.longitude == null || loc.longitude === "" ? null : Number(loc.longitude);
  if (lat != null && lng != null && !isWithinNycBounds(lat, lng)) {
    return {
      ok: false,
      error:
        "This address doesn't appear to be within New York City. Only businesses in the five boroughs can be listed.",
    };
  }

  return { ok: true };
}
