import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendBaseUrl = process.env.NEXT_PUBLIC_DISKUSI_FORUM_API_BASE_URL;

    if (!backendBaseUrl) {
      return [];
    }

    return [
      {
        source: "/api/diskusi-forum/:path*",
        destination: `${backendBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
