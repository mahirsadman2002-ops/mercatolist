import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/ratelimit";

const COOKIE = "mlvid";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Record a daily site visit. Fire-and-forget beacon from the client (see
 * VisitTracker). Cost-conscious by design:
 *  - the client only calls this once per visitor per day (localStorage guard),
 *  - the visitor id lives in an httpOnly cookie we set here (server-controlled,
 *    harder to spoof than a client-generated id),
 *  - a unique (visitorId, day) constraint makes repeat calls no-op upserts,
 *  - IP rate-limited so it can't be spammed to run up DB writes.
 * Never throws to the client — tracking must not break page loads.
 */
export async function POST(request: NextRequest) {
  try {
    const limit = await rateLimit(request, "visit");
    if (!limit.success) {
      // Silently accept — don't surface rate limiting to the beacon.
      return NextResponse.json({ success: true });
    }

    let visitorId = request.cookies.get(COOKIE)?.value;
    let setCookie = false;
    if (!visitorId || visitorId.length < 8 || visitorId.length > 64) {
      visitorId = randomUUID();
      setCookie = true;
    }

    const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

    // Idempotent per (visitor, day): create once, ignore the duplicate.
    await prisma.dailyVisit
      .create({ data: { visitorId, day } })
      .catch(() => {
        /* unique violation on repeat visit — expected, ignore */
      });

    const res = NextResponse.json({ success: true });
    if (setCookie) {
      res.cookies.set(COOKIE, visitorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: ONE_YEAR,
        path: "/",
      });
    }
    return res;
  } catch (err) {
    console.error("[track/visit] failed:", err);
    return NextResponse.json({ success: true }); // never break the client
  }
}
