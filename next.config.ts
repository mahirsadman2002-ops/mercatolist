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
      // S3 virtual-hosted URLs for uploaded listing photos and avatars.
      // Without this, next/image refuses to render images from the bucket.
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
