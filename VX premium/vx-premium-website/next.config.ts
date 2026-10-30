import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["svg-captcha"],
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: "/player-config.json",
        destination: "/api/player/config",
      },
    ];
  },
};

export default nextConfig;
