import { NextResponse } from "next/server";

// GET: Fetch reviews for a broker
// POST: Submit a new review
export async function GET() {
  return NextResponse.json({ success: true, data: [] });
}

export async function POST() {
  return NextResponse.json({ success: true, data: null }, { status: 201 });
}
