import type { Metadata } from "next";
import { pageHref, projectHref } from "@/lib/site";
import type { PageKey, Project, SiteContent } from "@/types/content";

/*
 * Search engine data for every page: titles, descriptions, canonical URLs, social previews
 * and Schema.org (JSON-LD). Everything is built from the site content, so it follows the editor.
 * Each page can also get a hand-written title/description in /admin → SEO (Google).
 * Rule: never state anything that is not in the content (clients, places, dates come from the projects).
 */

/** Canonical address (berlimestudio.com redirects to www). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.berlimestudio.com").replace(/\/$/, "");
export const SITE_NAME = "Berlim Estúdio";

/** Services the studio offers (positioning brief), used in Schema.org and llms.txt. */
export const SERVICES = [
  "Fotografia de eventos corporativos",
  "Cobertura fotográfica de eventos",
  "Filmagem de eventos corporativos",
  "Produção audiovisual para empresas",
  "Fotografia institucional",
  "Vídeos institucionais",
  "Cobertura de congressos e convenções",
  "Fotografia e vídeo para eventos de marcas",
  "Produção de conteúdo para empresas",
];

/** Main service area (the studio also works outside it). */
export const AREA_SERVED = [
  "Itajaí",
  "Balneário Camboriú",
  "Florianópolis",
  "Joinville",
  "Blumenau",
  "Jaraguá do Sul",
  "Guaramirim",
  "Brusque",
];

const MAX_TITLE = 60;
const MAX_DESCRIPTION = 158;

export const absoluteUrl = (path: string) => (/^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`);

/** Cuts at a word boundary, without breaking in the middle of a word. */
export function clip(text: string, max = MAX_DESCRIPTION) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:–—-]+$/, "")}…`;
}

/* ---------- business facts (from the footer) ---------- */

export interface Business {
  street: string;
  city: string;
  region: string;
  phone: string;
  /** +55 47 99279-0963 */
  phoneIntl: string;
  /** 5547992790963 (wa.me) */
  phoneDigits: string;
  email: string;
  socials: string[];
}

const UF: Record<string, string> = { "santa catarina": "SC", "paraná": "PR", "parana": "PR", "rio grande do sul": "RS", "são paulo": "SP", "sao paulo": "SP" };

export function business(content: SiteContent): Business {
  const { footer } = content;
  // "R. Onze de Junho, 91 - Fazenda\nItajaí - Santa Catarina"
  const [street = "", place = ""] = footer.address.split("\n").map((l) => l.trim());
  const [city = "", state = ""] = place.split(/\s[-–]\s|,\s*/).map((s) => s.trim());
  const region = UF[state.toLowerCase()] ?? (state.length === 2 ? state.toUpperCase() : state);
  const digits = footer.phone.replace(/\D/g, "");
  const national = digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;
  const phoneIntl = national.length >= 10 ? `+55 ${national.slice(0, 2)} ${national.slice(2, -4)}-${national.slice(-4)}` : footer.phone;
  return {
    street,
    city,
    region,
    phone: footer.phone,
    phoneIntl,
    phoneDigits: `55${national}`,
    email: footer.email,
    socials: footer.socials.map((s) => s.href).filter((h) => /^https?:\/\//.test(h)),
  };
}

/* ---------- projects ---------- */

const metaValue = (project: Project, ...labels: string[]) =>
  project.meta?.find((m) => labels.includes(m.label.trim().toLowerCase()))?.value.trim() ?? "";

/** "Hotel Sibara - Balneário Camboriú, SC" → "Balneário Camboriú, SC"; "Joinville - SC" → "Joinville, SC". */
export function cityOf(place: string) {
  const parts = place.split(/\s+[-–|]\s+/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return "";
  const last = parts[parts.length - 1];
  if (/^[A-Z]{2}$/.test(last) && parts.length > 1) return `${parts[parts.length - 2]}, ${last}`;
  return last;
}

const COVERAGE: Record<string, string> = {
  evento: "cobertura de evento",
  eventos: "cobertura de evento",
  fotografia: "cobertura fotográfica",
  "vídeo": "filmagem e vídeo",
  video: "filmagem e vídeo",
  "vídeos": "filmagem e vídeo",
};

const SHORT_COVERAGE: Record<string, string> = {
  "cobertura de evento": "evento",
  "cobertura fotográfica": "fotografia",
  "filmagem e vídeo": "vídeo",
};

export interface ProjectFacts {
  client: string;
  place: string;
  city: string;
  date: string;
  coverage: string;
}

export function projectFacts(project: Project): ProjectFacts {
  const place = metaValue(project, "local", "onde", "where");
  return {
    client: metaValue(project, "cliente", "client"),
    place,
    city: cityOf(place),
    date: metaValue(project, "data", "quando", "when"),
    coverage: COVERAGE[project.category.trim().toLowerCase()] ?? "fotografia e vídeo",
  };
}

const PT_MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** "Agosto 2026" → "2026-08" (Schema.org date), or undefined. */
export function isoMonth(date: string) {
  const m = date.toLowerCase().match(/([a-zç]+)\s+(?:de\s+)?(\d{4})/);
  const month = m ? PT_MONTHS.indexOf(m[1]) : -1;
  if (m && month >= 0) return `${m[2]}-${String(month + 1).padStart(2, "0")}`;
  return date.match(/\b(\d{4})\b/)?.[1];
}

export function projectTitle(project: Project) {
  if (project.seoTitle?.trim()) return project.seoTitle.trim();
  const { coverage, city } = projectFacts(project);
  const town = city.replace(/,\s*[A-Z]{2}$/, "");
  const firstTown = town.split(/\s+e\s+/)[0];
  const short = SHORT_COVERAGE[coverage] ?? coverage;
  // Longest version that fits, from most to least specific.
  const options = [
    city && `${project.title}: ${coverage} em ${city}`,
    town && `${project.title}: ${coverage} em ${town}`,
    town && `${project.title}: ${short} em ${town}`,
    firstTown && `${project.title}: ${short} em ${firstTown}`,
    `${project.title}: ${coverage}`,
  ].filter(Boolean) as string[];
  const suffix = ` | ${SITE_NAME}`;
  return (options.find((t) => t.length + suffix.length <= MAX_TITLE + 6) ?? project.title) + suffix;
}

export function projectDescription(content: SiteContent, project: Project) {
  if (project.seoDescription?.trim()) return clip(project.seoDescription);
  const { client, place, city, date } = projectFacts(project);
  const intro = (project.intro ?? content.projectPage.intro).trim();
  const line = (...facts: (string | false)[]) => {
    const f = facts.filter(Boolean).join(" · ");
    return [intro, f && `${f}.`].filter(Boolean).join(" ");
  };
  // Drop details until it fits, so the facts are never cut in the middle.
  const tries = [
    line(client && `Cliente: ${client}`, place && `Local: ${place}`, date && `Data: ${date}`),
    line(client && `Cliente: ${client}`, place && `Local: ${place}`),
    line(place && `Local: ${place}`),
    line(client && `Cliente: ${client}`, city && `Em ${city}`),
    line(city && `Em ${city}`),
  ];
  return clip(tries.find((t) => t.length <= MAX_DESCRIPTION) ?? tries[tries.length - 1]);
}

/** Alt text for the photos of a project: "Hangar 33 – foto 3 da cobertura em Joinville, SC". */
export function projectPhotoAlt(project: Project) {
  const { city, coverage } = projectFacts(project);
  return `${project.title} – ${coverage}${city ? ` em ${city}` : ""}`;
}

/* ---------- pages ---------- */

/** Cities where the portfolio has real work, in order of appearance. */
function portfolioCities(content: SiteContent) {
  const seen = new Set<string>();
  for (const p of content.projects) {
    const city = projectFacts(p).city.replace(/,\s*[A-Z]{2}$/, "");
    // "Jaraguá do Sul e Guaramirim" → both
    for (const c of city.split(/\s+e\s+/)) if (c && c.length > 2) seen.add(c);
  }
  return [...seen];
}

const list = (items: string[]) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`);

export function pageSeo(content: SiteContent, key: PageKey | "home"): { title: string; description: string } {
  const b = business(content);
  const where = [b.city, b.region].filter(Boolean).join(", ");
  const auto: Record<PageKey | "home", { title: string; description: string }> = {
    home: {
      title: `Fotografia e Vídeo para Eventos Corporativos | ${SITE_NAME}`,
      description: `Fotografia e filmagem de eventos corporativos, convenções, feiras e lançamentos de marca. Estúdio em ${where || "Santa Catarina"}, com atuação em todo o estado e além.`,
    },
    works: {
      title: `Portfólio de Fotografia e Vídeo de Eventos | ${SITE_NAME}`,
      description: (() => {
        const cities = portfolioCities(content).slice(0, 3);
        return `Coberturas de fotografia e vídeo da ${SITE_NAME} em eventos corporativos, convenções e eventos de marca${cities.length ? ` em ${list(cities)}` : ""}${b.region ? `, ${b.region}` : ""}.`;
      })(),
    },
    about: {
      title: `Sobre a ${SITE_NAME} | Fotografia e Vídeo em ${b.city || "SC"}`,
      description: `${content.about.intro.trim()} Foto e vídeo para empresas em ${where || "Santa Catarina"}.`,
    },
    contact: {
      title: `Contato e Orçamento | ${SITE_NAME}${b.city ? ` – ${b.city}, ${b.region}` : ""}`,
      description: `Peça um orçamento de fotografia ou vídeo para o seu evento ou empresa. Fale com a ${SITE_NAME}: ${b.phone} · ${b.email}.`,
    },
  };
  const custom = content.seo?.[key];
  return {
    title: custom?.title?.trim() || auto[key].title,
    description: clip(custom?.description?.trim() || auto[key].description),
  };
}

/* ---------- Next.js metadata ---------- */

/** Social preview image: any site photo resized to 1200×630 JPEG by /og (WebP is not read everywhere). */
export const ogImage = (src: string, alt: string) =>
  src ? [{ url: `/og?src=${encodeURIComponent(src)}`, width: 1200, height: 630, alt, type: "image/jpeg" }] : undefined;

export function buildMetadata({ title, description, path, image, imageAlt }: { title: string; description: string; path: string; image?: string; imageAlt?: string }): Metadata {
  const images = image ? ogImage(image, imageAlt ?? title) : undefined;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", locale: "pt_BR", siteName: SITE_NAME, url: path, title, description, images },
    twitter: { card: "summary_large_image", title, description, images: images?.map((i) => i.url) },
  };
}

/* ---------- Schema.org ---------- */

const ORG_ID = `${SITE_URL}/#organizacao`;
const WEBSITE_ID = `${SITE_URL}/#site`;

export function organizationJsonLd(content: SiteContent) {
  const b = business(content);
  const home = pageSeo(content, "home");
  const firstSlide = content.home.slides.find(Boolean);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": ORG_ID,
        name: SITE_NAME,
        alternateName: "BERLIM ESTÚDIO",
        url: `${SITE_URL}/`,
        logo: absoluteUrl(content.brand.logoBar),
        image: firstSlide ? absoluteUrl(firstSlide) : absoluteUrl(content.brand.logoBar),
        description: home.description,
        telephone: b.phoneIntl,
        email: b.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: b.street,
          addressLocality: b.city,
          addressRegion: b.region,
          addressCountry: "BR",
        },
        areaServed: [
          ...AREA_SERVED.map((name) => ({ "@type": "City", name, containedInPlace: { "@type": "State", name: "Santa Catarina" } })),
          { "@type": "State", name: "Santa Catarina" },
          { "@type": "Country", name: "Brasil" },
        ],
        knowsAbout: SERVICES,
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Serviços de fotografia e produção audiovisual",
          itemListElement: SERVICES.map((name) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name, provider: { "@id": ORG_ID } } })),
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          telephone: b.phoneIntl,
          email: b.email,
          availableLanguage: ["Portuguese"],
          areaServed: "BR",
        },
        sameAs: b.socials,
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        inLanguage: "pt-BR",
        publisher: { "@id": ORG_ID },
      },
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: absoluteUrl(item.path) })),
  };
}

const PAGE_NAMES: Record<PageKey, string> = { works: "Portfólio", about: "Sobre", contact: "Contato" };

export const pageName = (content: SiteContent, key: PageKey) =>
  content.nav.items.find((i) => i.href === pageHref(content, key))?.label || (key === "contact" ? content.nav.contact.label : "") || PAGE_NAMES[key];

export function pageJsonLd(content: SiteContent, key: PageKey) {
  const { title, description } = pageSeo(content, key);
  const path = pageHref(content, key);
  const type = key === "contact" ? "ContactPage" : key === "about" ? "AboutPage" : "CollectionPage";
  const page: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${absoluteUrl(path)}#pagina`,
    url: absoluteUrl(path),
    name: title,
    description,
    inLanguage: "pt-BR",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
  };
  if (key === "works") {
    page.mainEntity = {
      "@type": "ItemList",
      itemListElement: content.projects.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(projectHref(content, p.slug)), name: p.title })),
    };
  }
  return [page, breadcrumbJsonLd([{ name: "Início", path: "/" }, { name: pageName(content, key), path }])];
}

export function projectJsonLd(content: SiteContent, project: Project) {
  const facts = projectFacts(project);
  const path = projectHref(content, project.slug);
  const gallery = project.gallery ?? content.projectPage.gallery;
  const alt = projectPhotoAlt(project);
  return [
    {
      "@context": "https://schema.org",
      "@type": "ImageGallery",
      "@id": `${absoluteUrl(path)}#galeria`,
      url: absoluteUrl(path),
      name: project.title,
      headline: projectTitle(project).replace(` | ${SITE_NAME}`, ""),
      description: projectDescription(content, project),
      inLanguage: "pt-BR",
      genre: facts.coverage,
      ...(facts.date && isoMonth(facts.date) ? { dateCreated: isoMonth(facts.date) } : {}),
      ...(facts.place ? { locationCreated: { "@type": "Place", name: facts.place } } : {}),
      ...(facts.client ? { about: { "@type": "Organization", name: facts.client } } : {}),
      creator: { "@id": ORG_ID },
      publisher: { "@id": ORG_ID },
      isPartOf: { "@id": WEBSITE_ID },
      primaryImageOfPage: { "@type": "ImageObject", url: absoluteUrl(project.hero || project.image) },
      image: gallery.slice(0, 20).map((g, i) => ({
        "@type": "ImageObject",
        contentUrl: absoluteUrl(g.src),
        width: g.width,
        height: g.height,
        caption: `${alt} (foto ${i + 1})`,
        creator: { "@id": ORG_ID },
      })),
    },
    breadcrumbJsonLd([
      { name: "Início", path: "/" },
      { name: pageName(content, "works"), path: pageHref(content, "works") },
      { name: project.title, path },
    ]),
  ];
}
