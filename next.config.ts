import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      // The game is a static page in public/ (git submodule). Its assets use
      // relative paths, so it must load from its own folder's index.html.
      {
        source: "/mario-item-block",
        destination: "/mario-item-block/index.html",
        permanent: false,
      },
    ];
  },
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
