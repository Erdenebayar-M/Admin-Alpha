import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok-free.app", "*.ngrok.io"],
  async rewrites() {
    return [
      { source: "/api/admin/:path*", destination: "http://localhost:3000/api/admin/:path*" },
      { source: "/content/:path*", destination: "http://localhost:3000/content/:path*" },
    ];
  },
};

export default nextConfig;
