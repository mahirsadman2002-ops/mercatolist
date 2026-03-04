import { NextResponse } from "next/server";

// GET: Fetch blog posts
// POST: Create new blog post (admin only)
export async function GET() {
  return NextResponse.json({ success: true, data: [] });
}

export async function POST() {
  return NextResponse.json({ success: true, data: null }, { status: 201 });
}
