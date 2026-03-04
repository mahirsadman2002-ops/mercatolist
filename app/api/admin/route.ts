import { NextResponse } from "next/server";

// Admin-only API endpoints
// GET: Admin dashboard stats
export async function GET() {
  // TODO: Return admin dashboard analytics data
  return NextResponse.json({ success: true, data: {} });
}
