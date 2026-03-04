import { NextResponse } from "next/server";

// GET: Fetch user's collections
// POST: Create a new collection
export async function GET() {
  return NextResponse.json({ success: true, data: [] });
}

export async function POST() {
  return NextResponse.json({ success: true, data: null }, { status: 201 });
}
