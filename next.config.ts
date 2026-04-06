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
        source: "/brokers/:id",
        destination: "/advisors/:id",
        permanent: true,
      },
      {
        source: "/brokers/:id/review",
        destination: "/advisors/:id/review",
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
    ],
  },
};

export default nextConfig;
