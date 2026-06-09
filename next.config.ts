import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok-free.app", "*.ngrok.io"],
  experimental: {
    proxyTimeout: 300_000, // 5 min — LLM generation + AI review can take 60-120 s
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/api/admin/:path*", destination: "http://127.0.0.1:3000/api/admin/:path*" },
        { source: "/content/:path*",   destination: "http://127.0.0.1:3000/content/:path*" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
