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

type LimiterName =
  | "contact"
  | "geocode"
  | "view"
  | "feedback"
  | "login"
  | "register"
  | "authEmail"
  | "emailSend"
  | "inquiry"
  | "brokerEmail"
  | "upload"
  | "write";

// Sliding-window limits sized to each endpoint's blast radius. IP-keyed unless
// the caller passes an identifier (e.g. a userId) — see rateLimit() below.
//   contact:     5 / 10 min  — unauth email to admin inbox
//   geocode:     30 / min    — autocomplete fires while typing; needs headroom
//   view:        60 / min    — clicking through many listings; DB write spam
//   feedback:    5 / 10 min  — unauth email to admin + DB row
//   login:       10 / 15 min — password brute-force / credential-stuffing (IP)
//   register:    5 / hour    — unauth signup + verify-email send (IP)
//   authEmail:   10 / hour   — verify-email / resend-verification sends (IP)
//   emailSend:   10 / hour   — the arbitrary-recipient email/send route (userId)
//   inquiry:     10 / 10 min — inquiry + thread messages email the counterparty
//   brokerEmail: 30 / hour   — broker/collection email fan-out (userId)
//   upload:      30 / 10 min — S3 presigned URL minting (userId)
//   write:       30 / min    — generic authed create endpoints (userId)
function makeLimiter(name: string, max: number, window: Parameters<typeof Ratelimit.slidingWindow>[1]) {
  return new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(max, window),
    analytics: true,
    prefix: `rl:${name}`,
  });
}

const limiters: Record<LimiterName, Ratelimit | null> = redis
  ? {
      contact: makeLimiter("contact", 5, "10 m"),
      geocode: makeLimiter("geocode", 30, "1 m"),
      view: makeLimiter("view", 60, "1 m"),
      feedback: makeLimiter("feedback", 5, "10 m"),
      login: makeLimiter("login", 10, "15 m"),
      register: makeLimiter("register", 5, "1 h"),
      authEmail: makeLimiter("authEmail", 10, "1 h"),
      emailSend: makeLimiter("emailSend", 10, "1 h"),
      inquiry: makeLimiter("inquiry", 10, "10 m"),
      brokerEmail: makeLimiter("brokerEmail", 30, "1 h"),
      upload: makeLimiter("upload", 30, "10 m"),
      write: makeLimiter("write", 30, "1 m"),
    }
  : {
      contact: null,
      geocode: null,
      view: null,
      feedback: null,
      login: null,
      register: null,
      authEmail: null,
      emailSend: null,
      inquiry: null,
      brokerEmail: null,
      upload: null,
      write: null,
    };

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

/**
 * Enforce a named rate limit. By default the key is the client IP; pass
 * `identifier` (e.g. `session.user.id` or an email) to key on the actor
 * instead — the right choice for authenticated abuse where one user behind
 * one IP shouldn't be able to spam, and where NAT shouldn't punish innocents.
 */
export async function rateLimit(
  request: NextRequest,
  limiter: LimiterName,
  identifier?: string
): Promise<{ success: true } | { success: false; retryAfterSec: number }> {
  const key = identifier ? `id:${identifier}` : getClientIp(request);
  return rateLimitByKey(limiter, key);
}

/**
 * Rate-limit against an arbitrary key with no request object — for contexts
 * that don't have a NextRequest (e.g. NextAuth's `authorize`). Key on the
 * email/account being attacked so brute-force is throttled per target.
 */
export async function rateLimitByKey(
  limiter: LimiterName,
  key: string
): Promise<{ success: true } | { success: false; retryAfterSec: number }> {
  const limit = limiters[limiter];
  if (!limit) return { success: true };

  const result = await limit.limit(key);
  if (result.success) return { success: true };

  const retryAfterSec = Math.max(
    1,
    Math.ceil((result.reset - Date.now()) / 1000)
  );
  return { success: false, retryAfterSec };
}

/**
 * Standard 429 JSON response for a failed rate-limit check.
 */
export function rateLimitResponse(retryAfterSec: number) {
  return Response.json(
    { success: false, error: "Too many requests. Please try again shortly." },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}
