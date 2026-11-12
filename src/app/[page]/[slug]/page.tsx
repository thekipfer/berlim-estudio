import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ProjectPage } from "@/components/pages/project-page";
import { getContent } from "@/lib/content-store";
import { findProject, oldPageAt, projectHref } from "@/lib/site";

/* Project pages live under the Our Works address: /<works address>/<project>. */

interface ProjectRouteProps {
  params: Promise<{ page: string; slug: string }>;
}

export async function generateStaticParams() {
  const content = await getContent();
  return content.projects.map((project) => ({ page: content.pages.works, slug: project.slug }));
}

export async function generateMetadata({ params }: ProjectRouteProps): Promise<Metadata> {
  const { page, slug } = await params;
  const content = await getContent();
  const project = decodeURIComponent(page) === content.pages.works ? findProject(content, slug) : undefined;
  return { title: project ? `${project.title} – Berlim Estúdio` : "Berlim Estúdio" };
}

export default async function ProjectRoute({ params }: ProjectRouteProps) {
  const { page, slug } = await params;
  const content = await getContent();
  const worksPage = decodeURIComponent(page);

  if (worksPage !== content.pages.works) {
    // Old Our Works address: keep project links working.
    if (oldPageAt(content, worksPage) === "works") permanentRedirect(projectHref(content, slug));
    notFound();
  }

  // Project renamed (address follows the title): send old links to the new address.
  if (!findProject(content, slug)) {
    const moved = content.projects.find((p) => p.oldSlugs?.includes(slug));
    if (moved) permanentRedirect(projectHref(content, moved.slug));
  }

  return <ProjectPage slug={slug} />;
}
