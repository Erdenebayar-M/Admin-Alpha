import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:3000";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok-free.app", "*.ngrok.io"],
  experimental: {
    proxyTimeout: 300_000, // 5 min — LLM generation + AI review can take 60-120 s
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/api/admin/:path*", destination: `${backendUrl}/api/admin/:path*` },
        { source: "/content/:path*",   destination: `${backendUrl}/content/:path*` },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
