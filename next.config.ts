import type { NextConfig } from "next";

const privateRoutes = [
  "/",
  "/admin/:path*",
  "/approvals/:path*",
  "/auth/:path*",
  "/behaviors/:path*",
  "/child/:path*",
  "/child-mode/:path*",
  "/child-pin/:path*",
  "/consent/:path*",
  "/notifications/:path*",
  "/onboarding/:path*",
  "/records/:path*",
  "/reports/:path*",
  "/settings/:path*",
  "/api/:path*",
];

const privateCacheHeaders = [
  {
    key: "Cache-Control",
    value: "private, no-store, max-age=0",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      ...privateRoutes.map((source) => ({
        source,
        headers: privateCacheHeaders,
      })),
    ];
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
