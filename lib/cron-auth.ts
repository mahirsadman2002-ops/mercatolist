import { NextResponse } from "next/server";

/**
 * Authorize a Vercel Cron request.
 *
 * Fails CLOSED: if CRON_SECRET is unset/empty in this environment, every
 * request is rejected. The naive inline check (`header !== \`Bearer ${SECRET}\``)
 * fails OPEN when the secret is missing — the expected header becomes the
 * literal "Bearer undefined", which an attacker can simply send to trigger
 * mass-email / status-mutation cron jobs.
 *
 * Returns a NextResponse to short-circuit with when unauthorized, or null when
 * the caller may proceed.
 */
export function requireCron(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron] CRON_SECRET is not set — rejecting request");
    return NextResponse.json(
      { error: "Cron not configured" },
      { status: 500 }
    );
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
