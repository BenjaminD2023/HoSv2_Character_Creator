import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow transpilation of the @3d-dice packages
  transpilePackages: ["@3d-dice/dice-box"],
  // Ensure static assets are properly served
  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
