import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { auth } from "@/lib/auth";
import { authSecret, HANDOFF_SALT } from "@/lib/mobile-session";

// Step 1 of native-app sign-in via the website (used for Google accounts,
// which have no password the app could post to /api/mobile/auth/login).
//
// The app opens /login?callbackUrl=/api/mobile/auth/handoff?... in the system
// auth sheet. Once the browser has a web session:
//   GET  shows a confirmation page naming the account ("Sign in to the
//        MercatoList app as …?"). Nothing is issued on GET, so a link someone
//        tricks a signed-in user into opening can't mint anything.
//   POST (the Continue button, same-origin only) redirects into the app with a
//        short-lived code. The code is useless without the PKCE verifier that
//        never left the app; /api/mobile/auth/exchange checks both.

const CODE_MAX_AGE = 60; // seconds

// base64url SHA-256 digest
const CHALLENGE = /^[A-Za-z0-9_-]{43}$/;

// Only ever redirect into the app itself. Expo Go's exp:// scheme can be
// claimed by any Expo project, so it is accepted in local development only.
function redirectAllowed(redirect: string): boolean {
  if (redirect === "mercatolist://auth") return true;
  return process.env.NODE_ENV !== "production" && /^exp:\/\/[^\s"'<>]+$/.test(redirect);
}

const bad = () =>
  NextResponse.json({ success: false, error: "Invalid sign-in request." }, { status: 400 });

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get("challenge") ?? "";
  const redirect = request.nextUrl.searchParams.get("redirect") ?? "";
  if (!CHALLENGE.test(challenge) || !redirectAllowed(redirect)) return bad();

  const session = await auth();
  if (!session?.user?.id) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(loginUrl);
  }

  const who = esc(session.user.email ?? session.user.name ?? "your account");
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Sign in to the MercatoList app</title>
<style>
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f7f7f9;color:#17171c;display:flex;min-height:100vh;align-items:center;justify-content:center}
  main{background:#fff;border:1px solid #e8e8ec;border-radius:16px;padding:28px;margin:20px;max-width:380px;width:100%;text-align:center}
  h1{font-size:20px;margin:0 0 8px;color:#1a1f36}
  p{font-size:14px;line-height:1.5;color:#73737d;margin:0 0 20px}
  b{color:#17171c;word-break:break-all}
  button{width:100%;border:0;border-radius:12px;background:#12a5a0;color:#fff;font-size:16px;font-weight:600;padding:14px;cursor:pointer}
  small{display:block;margin-top:14px;font-size:12px;color:#73737d}
</style></head>
<body><main>
  <h1>Sign in to the MercatoList app?</h1>
  <p>You'll be signed in to the app as <b>${who}</b>.</p>
  <form method="post">
    <input type="hidden" name="challenge" value="${esc(challenge)}">
    <input type="hidden" name="redirect" value="${esc(redirect)}">
    <button type="submit">Continue</button>
  </form>
  <small>Didn't start this from the MercatoList app? Close this page.</small>
</main></body></html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      // The page must not be framed (clickjacking the Continue button).
      "X-Frame-Options": "DENY",
      "Content-Security-Policy": "frame-ancestors 'none'",
    },
  });
}

export async function POST(request: NextRequest) {
  // Same-origin form posts only.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return bad();

  const form = await request.formData().catch(() => null);
  const challenge = String(form?.get("challenge") ?? "");
  const redirect = String(form?.get("redirect") ?? "");
  if (!CHALLENGE.test(challenge) || !redirectAllowed(redirect)) return bad();

  const session = await auth();
  if (!session?.user?.id) return bad();

  const code = await encode({
    token: { sub: session.user.id, challenge, purpose: "mobile-handoff" },
    secret: authSecret(),
    salt: HANDOFF_SALT,
    maxAge: CODE_MAX_AGE,
  });

  const target = `${redirect}${redirect.includes("?") ? "&" : "?"}code=${encodeURIComponent(code)}`;
  return new NextResponse(null, { status: 303, headers: { Location: target } });
}
