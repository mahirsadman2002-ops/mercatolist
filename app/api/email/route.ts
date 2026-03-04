import { NextResponse } from "next/server";

// POST: Send transactional email
export async function POST() {
  return NextResponse.json({ success: true });
}
