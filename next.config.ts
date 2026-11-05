import type { NextConfig } from "next";

// Apps served under a path of this site, each from its own Vercel project
// (Next.js Multi-Zones). The URL is read at build time and has no trailing
// slash: https://maplestory-app.vercel.app in Vercel, or
// http://localhost:3002 in .env.local to use a local dev server. While it's
// unset (e.g. in CI), /maplestory is simply a 404 here.
const maplestoryUrl = process.env.MAPLESTORY_URL;

const nextConfig: NextConfig = {
  async rewrites() {
    if (!maplestoryUrl) {
      return [];
    }
    // The app's basePath is /maplestory, so paths pass through unchanged,
    // including its /maplestory/_next/... assets.
    return [
      { source: "/maplestory", destination: `${maplestoryUrl}/maplestory` },
      {
        source: "/maplestory/:path+",
        destination: `${maplestoryUrl}/maplestory/:path+`,
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
