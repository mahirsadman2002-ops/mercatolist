import { NextResponse } from "next/server";

// POST: Periodic saved listing marketing emails
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // TODO: Send marketing nudge emails for saved listings
  return NextResponse.json({ success: true, processed: 0 });
}
