import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const cloudflareWorkersStub = fileURLToPath(new URL("./db/cloudflare-workers-stub.ts", import.meta.url));

// Vinext and Cloudflare keep using vite.config.ts. This alias exists only while
// Vercel runs `next build`, so the Worker import does not fail that build.
const nextConfig: NextConfig = process.env.VERCEL === "1" ? {
  webpack: (config) => {
    config.resolve.alias["cloudflare:workers"] = cloudflareWorkersStub;
    return config;
  },
  turbopack: {
    resolveAlias: {
      "cloudflare:workers": "./db/cloudflare-workers-stub.ts",
    },
  },
} : {};

export default nextConfig;
