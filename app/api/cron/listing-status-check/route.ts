import { NextResponse } from "next/server";

// POST: 7-day listing status confirmation emails
// Secured with CRON_SECRET header
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // TODO: Find listings due for confirmation and send emails
  return NextResponse.json({ success: true, processed: 0 });
}
