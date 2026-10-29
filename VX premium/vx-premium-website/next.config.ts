import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["svg-captcha"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
