import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendBaseUrl = process.env.NEXT_PUBLIC_DISKUSI_FORUM_API_BASE_URL;
    const authApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

    const rewrites = [];

    if (backendBaseUrl) {
      rewrites.push({
        source: "/api/diskusi-forum/:path*",
        destination: `${backendBaseUrl}/:path*`,
      });
    }

    if (authApiUrl) {
      rewrites.push(
        {
          source: "/api/auth/:path*",
          destination: `${authApiUrl}/auth/:path*`,
        },
        {
          source: "/api/admin/:path*",
          destination: `${authApiUrl}/admin/:path*`,
        },
        {
          source: "/api/user/:path*",
          destination: `${authApiUrl}/user/:path*`,
        }
      );
    }

    return rewrites;
  },
};

export default nextConfig;
