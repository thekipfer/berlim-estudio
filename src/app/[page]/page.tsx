import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { AboutPage } from "@/components/pages/about-page";
import { ContactPage } from "@/components/pages/contact-page";
import { WorksPage } from "@/components/pages/works-page";
import { getContent } from "@/lib/content-store";
import { oldPageAt, PAGE_KEYS, pageAt, pageHref } from "@/lib/site";
import type { PageKey } from "@/types/content";

/*
 * Our Works, About and Contato live at the addresses set in the editor
 * (content.pages), e.g. /portfolio instead of /our-works.
 */

interface PageProps {
  params: Promise<{ page: string }>;
}

const titles: Record<PageKey, string> = {
  works: "Our Works",
  about: "About",
  contact: "Contato",
};

const pages: Record<PageKey, () => Promise<React.JSX.Element>> = {
  works: WorksPage,
  about: AboutPage,
  contact: ContactPage,
};

export async function generateStaticParams() {
  const content = await getContent();
  return PAGE_KEYS.map((key) => ({ page: content.pages[key] }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { page } = await params;
  const key = pageAt(await getContent(), decodeURIComponent(page));
  return key ? { title: `${titles[key]} – Berlim Estúdio` } : {};
}

export default async function Page({ params }: PageProps) {
  const slug = decodeURIComponent((await params).page);
  const content = await getContent();

  const key = pageAt(content, slug);
  if (key) {
    const Render = pages[key];
    return <Render />;
  }

  // Old address of a renamed page: send visitors (and Google) to the new one.
  const old = oldPageAt(content, slug);
  if (old) permanentRedirect(pageHref(content, old));

  notFound();
}
