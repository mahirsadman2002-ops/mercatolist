import { NextResponse } from "next/server";

// GET: Fetch messages for an inquiry thread
// POST: Send a new message in a thread
export async function GET() {
  return NextResponse.json({ success: true, data: [] });
}

export async function POST() {
  return NextResponse.json({ success: true, data: null }, { status: 201 });
}
