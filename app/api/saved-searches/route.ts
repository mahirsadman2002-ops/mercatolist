import { NextResponse } from "next/server";

// GET: Fetch user's saved searches
// POST: Create a new saved search
export async function GET() {
  return NextResponse.json({ success: true, data: [] });
}

export async function POST() {
  return NextResponse.json({ success: true, data: null }, { status: 201 });
}
