import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

// Shared Upstash Redis client. If the env vars aren't configured we leave the
// limiter as null and rateLimit() becomes a no-op — so local dev and CI work
// without a Redis instance, and prod requires UPSTASH_REDIS_REST_URL +
// UPSTASH_REDIS_REST_TOKEN to actually enforce limits.
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis =
  redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;

if (!redis && process.env.NODE_ENV === "production") {
  console.warn(
    "[ratelimit] Upstash env vars missing in production — rate limiting is DISABLED. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN."
  );
}

type LimiterName = "contact" | "geocode" | "view" | "feedback";

// Sliding-window limits sized to each endpoint's blast radius:
//   contact: 5 emails / 10 min per IP — enough for legit users, kills loops
//   geocode: 30 / min — autocomplete fires while typing, so this needs headroom
//   view:    60 / min — covers a user clicking through many listings; spam
//             writes to the DB hit a wall fast
const limiters: Record<LimiterName, Ratelimit | null> = redis
  ? {
      contact: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "10 m"),
        analytics: true,
        prefix: "rl:contact",
      }),
      geocode: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, "1 m"),
        analytics: true,
        prefix: "rl:geocode",
      }),
      view: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, "1 m"),
        analytics: true,
        prefix: "rl:view",
      }),
      feedback: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "10 m"),
        analytics: true,
        prefix: "rl:feedback",
      }),
    }
  : { contact: null, geocode: null, view: null, feedback: null };

/**
 * Best-effort client IP. Behind Vercel the `x-forwarded-for` header is set
 * to a comma-separated list; the leftmost entry is the real client. Falls
 * back to a constant key when no IP is present — that effectively shares the
 * limit across un-identifiable callers, which is the right behavior (it
 * makes spam from no-IP environments self-limit globally).
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "no-ip";
}

export async function rateLimit(
  request: NextRequest,
  limiter: LimiterName
): Promise<{ success: true } | { success: false; retryAfterSec: number }> {
  const limit = limiters[limiter];
  if (!limit) return { success: true };

  const ip = getClientIp(request);
  const result = await limit.limit(ip);

  if (result.success) return { success: true };

  const retryAfterSec = Math.max(
    1,
    Math.ceil((result.reset - Date.now()) / 1000)
  );
  return { success: false, retryAfterSec };
}
