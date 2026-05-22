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

    const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL?.replace(/\/$/, "");

    if (gatewayUrl) {
      rewrites.push(
        {
          source: "/api/auth/:path*",
          destination: `${gatewayUrl}/api/auth/:path*`,
        },
        {
          source: "/api/admin/:path*",
          destination: `${gatewayUrl}/api/admin/:path*`,
        },
        {
          source: "/api/user/:path*",
          destination: `${gatewayUrl}/api/user/:path*`,
        }
      );
    } else if (authApiUrl) {
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
