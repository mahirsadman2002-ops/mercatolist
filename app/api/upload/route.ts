import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generatePresignedUploadUrl } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fileType, folder } = body;

    if (!fileType || !fileType.startsWith("image/")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Only images are allowed.",
        },
        { status: 400 }
      );
    }

    // Surface a clearer error if AWS isn't configured on this deploy so the
    // developer/admin can fix it immediately instead of seeing a generic 500.
    const missingEnv: string[] = [];
    if (!process.env.AWS_REGION) missingEnv.push("AWS_REGION");
    if (!process.env.AWS_ACCESS_KEY_ID) missingEnv.push("AWS_ACCESS_KEY_ID");
    if (!process.env.AWS_SECRET_ACCESS_KEY)
      missingEnv.push("AWS_SECRET_ACCESS_KEY");
    if (!process.env.AWS_S3_BUCKET) missingEnv.push("AWS_S3_BUCKET");
    if (missingEnv.length > 0) {
      console.error("[upload] missing AWS env vars:", missingEnv);
      return NextResponse.json(
        {
          success: false,
          error: `Photo uploads aren't configured on this deploy. Missing: ${missingEnv.join(", ")}. Set these in your Vercel project's environment variables and redeploy.`,
        },
        { status: 500 },
      );
    }

    const { url, key } = await generatePresignedUploadUrl(
      fileType,
      folder || "listings",
    );

    return NextResponse.json({ success: true, data: { url, key } });
  } catch (error) {
    console.error("[upload] presign error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? `Upload failed: ${error.message}`
            : "Failed to generate upload URL",
      },
      { status: 500 },
    );
  }
}
