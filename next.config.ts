import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
