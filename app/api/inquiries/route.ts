import { NextResponse } from "next/server";

// GET: Fetch inquiries (received or sent based on query param)
// POST: Send a new inquiry (anonymous or authenticated)
export async function GET() {
  return NextResponse.json({ success: true, data: [] });
}

export async function POST() {
  return NextResponse.json({ success: true, data: null }, { status: 201 });
}
