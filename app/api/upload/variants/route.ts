import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { generateListingVariants, generateAvatarVariant } from "@/lib/image-variants";

// Called by the client right after an original has been PUT to S3, one request
// per image. It downloads that original server-side, produces the WebP
// variants, and returns their URLs. Deliberately per-image so each invocation
// is small and fast (no timeout risk on listings with many photos).
//
// Best-effort by contract: if variant generation fails we return success:true
// with null URLs, and the caller keeps the original — a listing must never be
// blocked from saving because a resize failed.
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Reuse the upload limiter — same cost class (S3 GET + PUTs).
    const limit = await rateLimit(request, "upload", session.user.id);
    if (!limit.success) return rateLimitResponse(limit.retryAfterSec);

    const { key, kind } = await request.json();
    if (typeof key !== "string" || !key) {
      return NextResponse.json({ success: false, error: "Missing key" }, { status: 400 });
    }

    // Only ever process keys inside our own upload prefixes — never an
    // arbitrary attacker-supplied path. Reject variant keys too (no recursion).
    const isListing = key.startsWith("listings/") && !key.startsWith("listings/variants/");
    const isAvatar = key.startsWith("avatars/") && !key.startsWith("avatars/variants/");
    if (!isListing && !isAvatar) {
      return NextResponse.json({ success: false, error: "Invalid key" }, { status: 400 });
    }

    if (kind === "avatar" || isAvatar) {
      const avatarUrl = await generateAvatarVariant(key);
      return NextResponse.json({ success: true, data: { avatarUrl } });
    }

    const variants = await generateListingVariants(key);
    return NextResponse.json({ success: true, data: variants ?? {} });
  } catch (error) {
    console.error("[upload/variants] error:", error);
    // Still 200-shaped success:false so the client's best-effort path is simple.
    return NextResponse.json(
      { success: false, error: "Failed to generate image variants" },
      { status: 500 }
    );
  }
}
