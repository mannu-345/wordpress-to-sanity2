import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  allowedDevOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  experimental: {
    externalDir: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      {
        protocol: 'https',
        hostname: 'kosukehome.net',
      }
    ],
  },
};

export default nextConfig;
