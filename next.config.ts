import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:3000";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok-free.app", "*.ngrok.io"],
  experimental: {
    proxyTimeout: 600_000, // 10 min — matches backend's LLM-route timeout (src/index.ts)
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
