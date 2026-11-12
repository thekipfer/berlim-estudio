import type { PageKey, PortfolioItem, Project, SiteContent } from "@/types/content";

export const PAGE_KEYS: PageKey[] = ["works", "about", "contact"];

/** Top-level paths used by the app itself; a page can't take these addresses. */
const RESERVED_SLUGS = new Set(["admin", "api", "images", "uploads", "seo", "favicon.ico", "_next"]);

export const pageHref = (content: SiteContent, key: PageKey) => `/${content.pages[key]}`;

export const projectHref = (content: SiteContent, slug: string) => `${pageHref(content, "works")}/${slug}`;

/** Which page lives at this address, if any. */
export const pageAt = (content: SiteContent, slug: string) => PAGE_KEYS.find((key) => content.pages[key] === slug);

/** Which page used to live at this address (for redirects), if any. */
export const oldPageAt = (content: SiteContent, slug: string) =>
  PAGE_KEYS.find((key) => content.oldPages[key].includes(slug) && content.pages[key] !== slug);

export const findProject = (content: SiteContent, slug: string) => content.projects.find((p) => p.slug === slug);

/** Card data for a project (used by the portfolio grids). */
export const toPortfolioItem = (content: SiteContent, project: Project, index?: number): PortfolioItem => ({
  title: project.title,
  category: project.category,
  image: project.image,
  href: projectHref(content, project.slug),
  tags: project.tags,
  editPath: index === undefined ? undefined : `projects.${index}`,
});

/** Index of a project in content.projects (-1 if missing). */
export const projectIndex = (content: SiteContent, slug: string) => content.projects.findIndex((p) => p.slug === slug);

/** Projects picked by slug, in the given order, skipping slugs that no longer exist. */
export const pickProjects = (content: SiteContent, slugs: string[]) =>
  slugs.map((slug) => findProject(content, slug)).filter((p): p is Project => p !== undefined);

/** Card items for the given slugs, keeping each project's editor path. */
export const projectItems = (content: SiteContent, slugs: string[]) =>
  slugs
    .map((slug) => projectIndex(content, slug))
    .filter((i) => i >= 0)
    .map((i) => toPortfolioItem(content, content.projects[i], i));

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export const isExternal = (href: string) => /^https?:\/\//.test(href);

/** URL-safe slug from a title ("Café da Manhã" → "cafe-da-manha"). */
export const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Point every "href" to /from (and /from/…) at /to, for all renamed addresses at once. */
function rewriteLinks<T>(value: T, renames: Map<string, string>): T {
  if (Array.isArray(value)) return value.map((v) => rewriteLinks(v, renames)) as T;
  if (typeof value !== "object" || value === null) return value;
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    if (key === "href" && typeof v === "string") {
      const match = v.match(/^\/([^/?#]+)(.*)$/);
      const to = match ? renames.get(match[1]) : undefined;
      out[key] = to ? `/${to}${match![2]}` : v;
    } else {
      out[key] = rewriteLinks(v, renames);
    }
  }
  return out as T;
}

/**
 * Applies page address changes made in the editor: cleans each address, keeps the
 * previous one if the new one is empty/reserved/taken, points every internal link
 * to the new address and remembers the old one so it can redirect.
 */
export function applyPageSlugs(previous: SiteContent, next: SiteContent): SiteContent {
  let content: SiteContent = { ...next, pages: { ...next.pages }, oldPages: { ...next.oldPages } };

  const slugs = {} as Record<PageKey, string>;
  for (const key of PAGE_KEYS) {
    const slug = slugify(next.pages[key] ?? "");
    slugs[key] = slug && !RESERVED_SLUGS.has(slug) ? slug : previous.pages[key];
  }
  // Two pages can't share an address: the clashing ones keep their previous address.
  // Previous addresses are all different, so this settles within a few passes.
  for (let pass = 0; pass < PAGE_KEYS.length; pass++) {
    const clashing = PAGE_KEYS.filter((key) => PAGE_KEYS.some((other) => other !== key && slugs[other] === slugs[key]));
    if (clashing.length === 0) break;
    for (const key of clashing) slugs[key] = previous.pages[key];
  }

  const taken = new Set(Object.values(slugs));
  const renames = new Map<string, string>();
  for (const key of PAGE_KEYS) {
    const before = previous.pages[key];
    content.pages[key] = slugs[key];
    if (slugs[key] === before) continue;
    renames.set(before, slugs[key]);
    content.oldPages[key] = [...new Set([...content.oldPages[key], before])];
  }
  if (renames.size > 0) content = rewriteLinks(content, renames);
  // An address that is now in use is no longer an old address of another page.
  for (const key of PAGE_KEYS) {
    content.oldPages[key] = content.oldPages[key].filter((s) => !taken.has(s));
  }
  return content;
}

/**
 * Project addresses that follow the title ("Método ROCHA" → "metodo-rocha") unless autoSlug is false.
 * Renamed projects keep their old address (it redirects) and every reference is updated:
 * the home grid, "Other works" and links pointing to /<works>/<old>.
 */
export function applyProjectSlugs(content: SiteContent): SiteContent {
  const renames = new Map<string, string>();
  const used = new Set<string>();
  const projects = content.projects.map((p) => {
    let slug = p.autoSlug === false ? slugify(p.slug) || slugify(p.title) : slugify(p.title) || slugify(p.slug);
    slug ||= "projeto";
    const base = slug;
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    used.add(slug);
    if (p.slug && slug !== p.slug) renames.set(p.slug, slug);
    return { ...p, slug };
  });
  if (renames.size === 0) return { ...content, projects };

  const follow = (s: string) => renames.get(s) ?? s;
  const works = content.pages.works;
  const fixHrefs = <T,>(value: T): T => {
    if (Array.isArray(value)) return value.map(fixHrefs) as T;
    if (typeof value !== "object" || value === null) return value;
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      const m = key === "href" && typeof v === "string" ? v.match(new RegExp(`^/${works}/([^/?#]+)(.*)$`)) : null;
      out[key] = m && renames.has(m[1]) ? `/${works}/${renames.get(m[1])}${m[2]}` : fixHrefs(v);
    }
    return out as T;
  };

  const updated: SiteContent = {
    ...content,
    home: { ...content.home, works: content.home.works.map(follow) },
    projects: projects.map((p, i) => {
      const old = new Set(p.oldSlugs ?? []);
      const before = content.projects[i].slug;
      if (before && before !== p.slug) old.add(before);
      for (const s of used) old.delete(s); // an address in use is no longer "old"
      return { ...p, related: p.related.map(follow), oldSlugs: [...old] };
    }),
  };
  return fixHrefs(updated);
}

