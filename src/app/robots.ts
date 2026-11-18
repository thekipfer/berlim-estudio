import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/* robots.txt: everything public is crawlable; the editor is not. */

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
