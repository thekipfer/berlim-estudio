import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content-store";
import { absoluteUrl } from "@/lib/seo";
import { PAGE_KEYS, pageHref, projectHref } from "@/lib/site";

/* sitemap.xml: home, pages and every project, with their photos (Google Images). Follows the editor. */

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await getContent();
  const photos = (srcs: (string | undefined)[]) => [...new Set(srcs.filter((s): s is string => Boolean(s)))].slice(0, 50).map(absoluteUrl);

  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1, images: photos(content.home.slides) },
    ...PAGE_KEYS.map((key) => ({
      url: absoluteUrl(pageHref(content, key)),
      changeFrequency: key === "works" ? ("weekly" as const) : ("monthly" as const),
      priority: key === "works" ? 0.9 : key === "contact" ? 0.8 : 0.7,
      images: photos([{ works: content.projects[0]?.image, about: content.about.heroImage, contact: content.contact.image }[key]]),
    })),
    ...content.projects.map((p) => ({
      url: absoluteUrl(projectHref(content, p.slug)),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      images: photos([p.hero, p.image, ...(p.gallery ?? content.projectPage.gallery).map((g) => g.src)]),
    })),
  ];
}
