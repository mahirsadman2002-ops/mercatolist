import { NextResponse } from "next/server";
import { requireCron } from "@/lib/cron-auth";

// POST: Daily unread message digest
async function handler(request: Request) {
  const denied = requireCron(request);
  if (denied) return denied;
  // TODO: Send daily unread message digest to users
  return NextResponse.json({ success: true, processed: 0 });
}

// Vercel Cron invokes with GET; POST kept for manual triggering
export { handler as GET, handler as POST };
