import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin the root explicitly: the folder name has an accent ("Estúdio"),
  // which breaks Turbopack's automatic root detection on recompiles.
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    // The dev cache kept serving old server code after edits (the accented folder name breaks
    // Turbopack's change detection), causing hydration errors. Without it every restart is fresh.
    turbopackFileSystemCacheForDev: false,
  },
  // Photos uploaded through the /admin editor live in Vercel Blob.
  images: {
    // WebP only: AVIF encoding hung on some photo sizes and left images blank.
    formats: ["image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
