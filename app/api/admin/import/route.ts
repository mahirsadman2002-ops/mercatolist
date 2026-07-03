import { NextRequest, NextResponse } from "next/server";
import { createListingForSeller } from "@/lib/create-listing-for-seller";
import { rehostImageFromUrl, uploadBufferToS3 } from "@/lib/s3";

// This endpoint is called cross-origin by the import bookmarklet running in the
// admin's browser (e.g. on a BizBuySell tab). It's authenticated by a secret
// token, NOT a session cookie, so we open CORS for it.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  const token = process.env.ADMIN_IMPORT_TOKEN;
  if (!token) {
    return json({ success: false, error: "Import is not configured (ADMIN_IMPORT_TOKEN unset)." }, 503);
  }

  const auth = request.headers.get("authorization") || "";
  if (auth !== `Bearer ${token}`) {
    return json({ success: false, error: "Unauthorized" }, 401);
  }

  try {
    const body = await request.json();
    const seller = body.seller ?? {};
    const listing = body.listing ?? {};

    // --- Resolve photos → our S3 CDN URLs ---
    const hosted: Array<{ url: string; order: number }> = [];
    let order = 0;

    // (a) Base64 data URLs the bookmarklet managed to read in-browser.
    const photoData: string[] = Array.isArray(body.photoData) ? body.photoData : [];
    for (const dataUrl of photoData) {
      try {
        const m = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(String(dataUrl));
        if (!m) continue;
        const buffer = Buffer.from(m[2], "base64");
        const url = await uploadBufferToS3(buffer, m[1], "listings");
        hosted.push({ url, order: order++ });
      } catch {
        // skip a bad image
      }
    }

    // (b) Image URLs — best-effort server-side re-host (works for open sites,
    //     silently fails for bot-walled sources like BizBuySell).
    const photoUrls: string[] = Array.isArray(body.photoUrls) ? body.photoUrls : [];
    for (const u of photoUrls) {
      const url = await rehostImageFromUrl(String(u), "listings");
      if (url) hosted.push({ url, order: order++ });
    }

    const result = await createListingForSeller(seller, { ...listing, photos: hosted });
    if (!result.ok) {
      return json({ success: false, error: result.error }, result.status);
    }

    return json(
      {
        success: true,
        data: {
          listing: result.listing,
          owner: result.owner,
          photosAttached: hosted.length,
          photosRequested: photoData.length + photoUrls.length,
        },
      },
      201
    );
  } catch (error) {
    console.error("Import error:", error);
    return json({ success: false, error: "Import failed" }, 500);
  }
}
