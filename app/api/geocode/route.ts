import { NextResponse } from "next/server";

// GET: Proxy Mapbox geocoding requests
export async function GET() {
  // TODO: Implement geocoding proxy using lib/mapbox.ts
  return NextResponse.json({ success: true, data: null });
}
