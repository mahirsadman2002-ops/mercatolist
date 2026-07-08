import type { NextConfig } from "next";

// Content-Security-Policy. Defense-in-depth against XSS / data exfiltration /
// clickjacking. Deliberately pragmatic rather than nonce-strict so it doesn't
// break the app's real dependencies:
//  - script-src allows 'unsafe-inline'/'unsafe-eval' because Next.js injects
//    inline bootstrap scripts, JSON-LD, and Vercel Analytics (moving to nonces
//    is a separate, larger change).
//  - Mapbox GL uses Web Workers from blob: URLs and fetches tiles/styles from
//    *.mapbox.com — worker-src blob: and connect/img entries cover it. (The
//    HEIC converter, heic2any, also needs worker-src blob:.)
//  - img-src allows https:/data:/blob: for S3/CloudFront photos, avatars,
//    Mapbox tiles, and client-side image previews.
// The value hardeners that cost nothing: object-src 'none', base-uri 'self',
// form-action 'self', frame-ancestors 'none'.
const csp = [
  "default-src 'self'",
  // va.vercel-scripts.com: Vercel Web Analytics loader (used in dev; prod
  // serves it same-origin, but allowlisting it keeps both clean).
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
  // api.mapbox.com: Mapbox GL ships its stylesheet from there — REQUIRED or
  // the map renders unstyled.
  "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "connect-src 'self' https: blob:",
  "frame-src 'self' https://accounts.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

// Conservative security headers applied to every response.
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      {
        source: "/brokers",
        destination: "/advisors",
        permanent: true,
      },
      {
        source: "/brokers/:path*",
        destination: "/advisors/:path*",
        permanent: true,
      },
      {
        source: "/register/broker",
        destination: "/register/advisor",
        permanent: true,
      },
      {
        source: "/register/broker-details",
        destination: "/register/advisor-details",
        permanent: true,
      },
    ];
  },
  images: {
    // Serve images straight from S3 with ZERO Vercel transformations. Phase 2
    // (lib/image-variants.ts) now generates pre-resized WebP variants at upload
    // — thumb/card/full, served directly with a 1-year immutable cache header —
    // so we get right-sized images WITHOUT the optimizer that caused the
    // transformation overage. `unoptimized` keeps every <Image> off it for good;
    // the components pick the correct variant per surface via pickPhotoUrl().
    unoptimized: true,
    // Minimal width sets for if/when optimization is ever re-enabled.
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [200, 400],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // S3 virtual-hosted URL for the uploads bucket. Wildcards in the
      // middle of a hostname aren't reliable in remotePatterns, so we list
      // the exact host. URL shape: {bucket}.s3.{region}.amazonaws.com
      {
        protocol: "https",
        hostname: "mercatolist-photos.s3.us-east-2.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
