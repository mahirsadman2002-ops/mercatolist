import { NextResponse } from "next/server";

// POST: Check for new listings matching saved searches
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // TODO: Match saved searches against new listings and notify users
  return NextResponse.json({ success: true, processed: 0 });
}
