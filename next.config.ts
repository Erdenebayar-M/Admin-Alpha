import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok-free.app", "*.ngrok.io"],
  async rewrites() {
    return [
      { source: "/content/:path*", destination: "http://localhost:3000/content/:path*" },
    ];
  },
};

export default nextConfig;
