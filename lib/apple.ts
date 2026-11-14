import { createRemoteJWKSet, jwtVerify, SignJWT, importPKCS8 } from "jose";

// Sign in with Apple, native-app flavour: the app gets an identity token from
// iOS and posts it to /api/mobile/auth/apple; this verifies it against Apple's
// public keys. A private key is only needed for the optional parts (trading the
// one-time authorization code for a refresh token, and revoking it when the
// user deletes their account, which Apple asks apps to do):
//   APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY (contents of the .p8)

const APPLE_ISSUER = "https://appleid.apple.com";
const jwks = createRemoteJWKSet(new URL(`${APPLE_ISSUER}/auth/keys`));

export function appleClientId(): string {
  return process.env.APPLE_BUNDLE_ID ?? "com.mercatolist.app";
}

export interface AppleIdentity {
  sub: string;
  email: string | null;
  emailVerified: boolean;
}

export async function verifyAppleIdentityToken(identityToken: string): Promise<AppleIdentity> {
  // Expo Go signs tokens for its own bundle id; accept it outside production
  // so the flow can be tried in development.
  const audience =
    process.env.NODE_ENV === "production"
      ? [appleClientId()]
      : [appleClientId(), "host.exp.Exponent"];
  const { payload } = await jwtVerify(identityToken, jwks, {
    issuer: APPLE_ISSUER,
    audience,
  });
  if (!payload.sub) throw new Error("Apple token has no subject");
  const emailVerified = payload.email_verified === true || payload.email_verified === "true";
  return {
    sub: payload.sub,
    email: typeof payload.email === "string" ? payload.email.toLowerCase() : null,
    emailVerified,
  };
}

function keyConfig() {
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  return teamId && keyId && privateKey ? { teamId, keyId, privateKey } : null;
}

async function clientSecret(): Promise<string | null> {
  const cfg = keyConfig();
  if (!cfg) return null;
  const key = await importPKCS8(cfg.privateKey, "ES256");
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: cfg.keyId })
    .setIssuer(cfg.teamId)
    .setSubject(appleClientId())
    .setAudience(APPLE_ISSUER)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);
}

/** Trade the one-time authorization code for a refresh token (null if not configured or it fails). */
export async function exchangeAppleCode(authorizationCode: string): Promise<string | null> {
  try {
    const secret = await clientSecret();
    if (!secret) return null;
    const res = await fetch(`${APPLE_ISSUER}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: appleClientId(),
        client_secret: secret,
        code: authorizationCode,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok) {
      console.error("[apple] code exchange failed:", res.status);
      return null;
    }
    const json = (await res.json()) as { refresh_token?: string };
    return json.refresh_token ?? null;
  } catch (error) {
    console.error("[apple] code exchange error:", error);
    return null;
  }
}

/** Revoke a user's Apple authorization (called on account deletion). Best effort. */
export async function revokeAppleToken(refreshToken: string): Promise<void> {
  try {
    const secret = await clientSecret();
    if (!secret) return;
    const res = await fetch(`${APPLE_ISSUER}/auth/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: appleClientId(),
        client_secret: secret,
        token: refreshToken,
        token_type_hint: "refresh_token",
      }),
    });
    if (!res.ok) console.error("[apple] revoke failed:", res.status);
  } catch (error) {
    console.error("[apple] revoke error:", error);
  }
}
