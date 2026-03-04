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

    const { url, key } = await generatePresignedUploadUrl(
      fileType,
      folder || "listings"
    );

    return NextResponse.json({ success: true, data: { url, key } });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
