import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const cloudflareStub = path.join(root, "db/cloudflare-workers-stub.ts");

// Cloudflare builds keep this config empty. On Vercel, alias the Workers-only
// module so `next build` can compile the same server code.
const nextConfig: NextConfig = process.env.VERCEL
  ? {
      turbopack: {
        resolveAlias: {
          "cloudflare:workers": "./db/cloudflare-workers-stub.ts",
        },
      },
      webpack: (config) => {
        config.resolve ??= {};
        config.resolve.alias = {
          ...(typeof config.resolve.alias === "object" && config.resolve.alias ? config.resolve.alias : {}),
          "cloudflare:workers": cloudflareStub,
        };
        return config;
      },
    }
  : {};

export default nextConfig;
