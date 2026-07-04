import { NextResponse } from "next/server";
import { BUSINESS_CATEGORIES } from "@/lib/constants";

// Public list of business categories. Consumed cross-origin by the import
// bookmarklet (running on a source-site tab) so its category dropdown always
// matches the app's canonical list — no hardcoded copy to drift out of sync.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  // Categories change rarely; let the CDN cache for an hour.
  "Cache-Control": "public, max-age=3600",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export function GET() {
  return NextResponse.json(
    { success: true, data: BUSINESS_CATEGORIES },
    { headers: CORS_HEADERS }
  );
}
