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

const NYC_BOROUGHS: Borough[] = [
  "MANHATTAN",
  "BROOKLYN",
  "QUEENS",
  "BRONX",
  "STATEN_ISLAND",
];

export function isNycBorough(borough: string | null | undefined): boolean {
  return NYC_BOROUGHS.includes(String(borough || "").toUpperCase() as Borough);
}

// Approximate geographic center of each borough. Used as the map location when
// a listing's exact address is hidden or unknown (better than 0,0 / null,
// which the DB rejects and which would drop the pin off the map).
const BOROUGH_CENTERS: Record<Borough, { lat: number; lng: number }> = {
  MANHATTAN: { lat: 40.7831, lng: -73.9712 },
  BROOKLYN: { lat: 40.6782, lng: -73.9442 },
  QUEENS: { lat: 40.7282, lng: -73.7949 },
  BRONX: { lat: 40.8448, lng: -73.8648 },
  STATEN_ISLAND: { lat: 40.5795, lng: -74.1502 },
};

// Fallback coordinates for a borough (defaults to the NYC centroid).
export function boroughCenter(borough: string | null | undefined): {
  lat: number;
  lng: number;
} {
  const b = String(borough || "").toUpperCase() as Borough;
  return BOROUGH_CENTERS[b] || { lat: 40.7128, lng: -74.006 };
}

/**
 * Validate that a listing's location is inside NYC. Returns { ok } or
 * { ok: false, error } with a user-facing message. Call before publishing /
 * creating a live listing.
 *
 * BOROUGH is the primary signal: it's already constrained to the five boroughs,
 * so a valid borough means the listing is in NYC — even when the seller hides
 * the address and leaves the ZIP blank. The ZIP and coordinates are only used
 * as consistency guards *when they're provided* (e.g. a Brooklyn borough paired
 * with a Boston ZIP, or out-of-town coordinates, is rejected).
 */
export function validateNycLocation(loc: {
  borough?: string | null;
  zipCode?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}): { ok: true } | { ok: false; error: string } {
  const hasBorough = isNycBorough(loc.borough);
  const zip = String(loc.zipCode || "").trim();

  // Need at least one positive signal that this is NYC.
  if (!hasBorough && !isNycZip(zip)) {
    return {
      ok: false,
      error:
        "MercatoList only lists businesses in the five NYC boroughs. Select a borough (or enter a NYC ZIP code).",
    };
  }

  // If a ZIP was provided, it must actually be a NYC ZIP — catches a NYC
  // borough accidentally paired with an out-of-town ZIP.
  if (zip && !isNycZip(zip)) {
    return {
      ok: false,
      error: "That ZIP code isn't in New York City. Leave it blank or use a NYC ZIP.",
    };
  }

  // If real coordinates are present (non-zero), they must be within NYC —
  // guards against spoofed values. Zero/absent coordinates are treated as
  // "not provided" (the seller hid the address).
  const lat = Number(loc.latitude);
  const lng = Number(loc.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
  if (hasCoords && !isWithinNycBounds(lat, lng)) {
    return {
      ok: false,
      error:
        "This address doesn't appear to be within New York City. Only businesses in the five boroughs can be listed.",
    };
  }

  return { ok: true };
}
