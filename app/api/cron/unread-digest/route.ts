import { NextResponse } from "next/server";

// POST: Daily unread message digest
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // TODO: Send daily unread message digest to users
  return NextResponse.json({ success: true, processed: 0 });
}
