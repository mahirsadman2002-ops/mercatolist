import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  generatePresignedUploadUrl,
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
} from "@/lib/s3";
import { rateLimit, rateLimitResponse } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Cap how many presigned URLs one user can mint (S3 PUT / storage cost).
    const limit = await rateLimit(request, "upload", session.user.id);
    if (!limit.success) return rateLimitResponse(limit.retryAfterSec);

    const body = await request.json();
    const { fileType, folder, fileSize } = body;

    if (!fileType || !ALLOWED_UPLOAD_TYPES.includes(fileType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF.",
        },
        { status: 400 }
      );
    }

    // Enforce a max size. fileSize is optional for backward-compat, but when
    // present we both reject oversize here and bind it into the S3 signature.
    if (fileSize != null) {
      if (typeof fileSize !== "number" || fileSize <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid file size." },
          { status: 400 }
        );
      }
      if (fileSize > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          {
            success: false,
            error: `File too large. Maximum size is ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.`,
          },
          { status: 400 }
        );
      }
    }

    const hasAwsEnv =
      process.env.AWS_REGION &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_S3_BUCKET;
    if (!hasAwsEnv) {
      console.error("[upload] missing AWS env vars");
      return NextResponse.json(
        {
          success: false,
          error: "Photo uploads aren't configured on this deploy.",
        },
        { status: 503 }
      );
    }

    const { url, key } = await generatePresignedUploadUrl(
      fileType,
      folder || "listings",
      typeof fileSize === "number" ? fileSize : undefined
    );

    return NextResponse.json({ success: true, data: { url, key } });
  } catch (error) {
    // Log details server-side; never leak internals to the client.
    console.error("[upload] presign error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
