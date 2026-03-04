import { NextResponse } from "next/server";

// POST: Submit a report (listing, review, deal, or user)
export async function POST() {
  return NextResponse.json({ success: true, data: null }, { status: 201 });
}
