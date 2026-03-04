import { NextResponse } from "next/server";

// POST: Generate S3 presigned upload URL
export async function POST() {
  // TODO: Generate presigned URL using lib/s3.ts
  return NextResponse.json({ success: true, data: { url: "", key: "" } });
}
