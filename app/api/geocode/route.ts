import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress, searchAddresses } from "@/lib/mapbox";

// GET: Proxy Mapbox geocoding requests
// Query params:
//   - address: full address to geocode (returns single result)
//   - q: partial query for address autocomplete (returns multiple suggestions)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const query = searchParams.get("q");

    if (address) {
      const result = await geocodeAddress(address);
      if (!result) {
        return NextResponse.json(
          { success: false, error: "Address not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: result });
    }

    if (query) {
      const limit = Math.min(10, parseInt(searchParams.get("limit") || "5"));
      const results = await searchAddresses(query, limit);
      return NextResponse.json({ success: true, data: results });
    }

    return NextResponse.json(
      { success: false, error: "Provide 'address' or 'q' query parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Geocode API error:", error);
    return NextResponse.json(
      { success: false, error: "Geocoding service unavailable" },
      { status: 500 }
    );
  }
}
