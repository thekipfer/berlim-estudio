import Image from "next/image";
import { notFound } from "next/navigation";
import { ProjectGallery } from "@/components/project-gallery";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WorkCard } from "@/components/work-card";
import { getContent } from "@/lib/content-store";
import { findProject, projectIndex, projectItems } from "@/lib/site";
import { edit, editImage } from "@/lib/editable";

export async function ProjectPage({ slug }: { slug: string }) {
  const content = await getContent();
  const project = findProject(content, slug);
  if (!project) notFound();

  const { projectPage } = content;
  const path = `projects.${projectIndex(content, slug)}`;
  const related = projectItems(content, project.related.filter((s) => s !== project.slug));

  return (
    <>
      <SiteHeader centerLogo />
      <main>
        {/* Full-height cover with the title at the bottom */}
        <section className="relative flex min-h-screen items-end" {...editImage(`${path}.hero`)}>
          <Image src={project.hero} alt="" fill preload sizes="100vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative mx-auto w-full max-w-[1140px] px-5 pb-5 tab:pb-[30px] desk:px-0 desk:pb-10">
            <h1 className="mx-auto w-full text-center font-heading text-[30px] leading-[1.3] font-semibold text-white tab:w-[80%] tab:text-[44px] tab:leading-[1.1] tab:tracking-[-1px] desk:mx-0 desk:w-[70%] desk:text-left desk:text-[60px]" {...edit(`${path}.title`)}>
              {project.title}
            </h1>
          </div>
        </section>

        {/* Intro + Client / Where / When */}
        <section className="py-[60px] desk:py-[100px]">
          <div className="mx-auto max-w-[1140px] px-5 desk:px-0">
            <h2 className="text-center font-heading text-[26px] leading-[1.4] tab:text-[30px] tab:leading-[1.3] desk:text-left desk:text-[36px]" {...edit(`${path}.intro`)}>
              {project.intro ?? projectPage.intro}
            </h2>
            <dl className="mt-10 grid grid-cols-1 gap-y-5 text-center tab:mt-[60px] tab:grid-cols-3 desk:text-left">
              {(project.meta ?? projectPage.meta).map((item, i) => (
                <div key={i}>
                  <dt className="font-heading text-[18px] leading-none font-semibold text-[#818181] uppercase" {...edit(`${path}.meta.${i}.label`)}>
                    {item.label}
                  </dt>
                  <dd className="mt-[10px] text-[18px] leading-none text-black" {...edit(`${path}.meta.${i}.value`)}>
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <ProjectGallery images={project.gallery ?? projectPage.gallery} editPath={`${path}.gallery`} />
        {/* Breathing room before the footer when there is no "Other works" block */}
        {related.length === 0 && <div className="h-[60px] desk:h-[100px]" />}

        {related.length > 0 && (
          <>
            {/* Other works */}
            <section className="pt-[30px] pb-10 tab:pt-10 desk:pt-[60px]">
              <h2 className="text-center font-heading text-[40px] leading-none lowercase tab:text-[80px] desk:text-[140px]" {...edit("projectPage.otherTitle")}>
                {projectPage.otherTitle}
              </h2>
            </section>
            <section className="pb-10">
              <div className="mx-auto max-w-[1140px] px-5 tab:px-[30px] desk:px-0">
                <div className="flex flex-wrap justify-between">
                  {related.map((item, i) => (
                    <WorkCard key={item.href} item={item} index={i} />
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
