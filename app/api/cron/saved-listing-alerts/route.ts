import { NextResponse } from "next/server";

// POST: 24hr saved listing status change checks
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // TODO: Check saved listings for status changes and email users
  return NextResponse.json({ success: true, processed: 0 });
}
