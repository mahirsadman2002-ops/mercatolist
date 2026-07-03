import type { NextConfig } from "next";

// Conservative security headers applied to every response. Deliberately no
// strict CSP yet — the app loads Mapbox, S3/CloudFront, Google OAuth, Vercel
// Analytics and inline JSON-LD, so a CSP needs its own testing pass. These
// headers are safe wins that don't risk breaking functionality.
const securityHeaders = [
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
