import { NextRequest, NextResponse } from "next/server";
import { boroughFromZip } from "@/lib/nyc-geo";
import { NEIGHBORHOODS } from "@/lib/constants";

// Address autocomplete for the import bookmarklet. Called cross-origin from a
// source-site tab and authed by ADMIN_IMPORT_TOKEN (same pattern as the seller
// search endpoint). Proxies Mapbox so the access token stays server-side, and
// resolves each suggestion to our borough enum / canonical neighborhood so the
// bookmarklet can fill the location fields in one click.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// Mapbox reports every NYC address's city as "New York"; the borough shows up
// as the `locality` context entry. ZIP stays the primary signal (deterministic
// per borough) — this map is only the fallback, mirroring the listing form.
const BOROUGH_BY_NAME: Record<string, string> = {
  MANHATTAN: "MANHATTAN",
  BROOKLYN: "BROOKLYN",
  QUEENS: "QUEENS",
  BRONX: "BRONX",
  "THE BRONX": "BRONX",
  "STATEN ISLAND": "STATEN_ISLAND",
};

export async function GET(request: NextRequest) {
  const token = process.env.ADMIN_IMPORT_TOKEN;
  if (!token) {
    return json({ success: false, error: "Import is not configured." }, 503);
  }
  if (request.headers.get("authorization") !== `Bearer ${token}`) {
    return json({ success: false, error: "Unauthorized" }, 401);
  }

  const q = (new URL(request.url).searchParams.get("q") || "").trim();
  if (q.length < 3) {
    return json({ success: true, data: [] });
  }

  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
  if (!mapboxToken) {
    return json({ success: false, error: "Geocoding is not configured." }, 503);
  }

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
    `?access_token=${mapboxToken}&limit=6&country=US&bbox=-74.26,40.49,-73.70,40.92&types=address&autocomplete=true`;
  const res = await fetch(url);
  if (!res.ok) {
    return json({ success: true, data: [] });
  }
  const data = await res.json();

  type Feature = {
    text?: string;
    address?: string;
    place_name?: string;
    center?: [number, number];
    context?: Array<{ id?: string; text?: string }>;
  };
  const suggestions = ((data.features || []) as Feature[]).map((f) => {
    const ctx = (kind: string) =>
      (f.context || []).find((c) => (c.id || "").startsWith(`${kind}.`))?.text || "";
    const zip = ctx("postcode");
    const borough =
      boroughFromZip(zip) || BOROUGH_BY_NAME[ctx("locality").toUpperCase()] || "";
    const rawHood = ctx("neighborhood").trim();
    const canonicalHood = borough
      ? (NEIGHBORHOODS[borough] || []).find(
          (n) => n.toLowerCase() === rawHood.toLowerCase()
        )
      : undefined;
    return {
      label: f.place_name || "",
      // Street line only ("123 Smith St") — borough/ZIP go to their own fields.
      address: [f.address, f.text].filter(Boolean).join(" "),
      zipCode: zip,
      borough,
      neighborhood: canonicalHood || rawHood,
      latitude: f.center?.[1] ?? null,
      longitude: f.center?.[0] ?? null,
    };
  });

  return json({ success: true, data: suggestions });
}
