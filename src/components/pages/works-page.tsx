import { OurWorksGrid } from "@/components/our-works-grid";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getContent } from "@/lib/content-store";
import { toPortfolioItem } from "@/lib/site";
import { edit } from "@/lib/editable";

export async function WorksPage() {
  const content = await getContent();
  const { works, projects } = content;
  return (
    <>
      <SiteHeader variant="page" />
      <main>
        <section className="pt-[30px] pb-10 tab:pt-10 desk:pt-[60px]">
          <h1 className="text-center font-heading text-[40px] leading-none lowercase tab:text-[80px] desk:text-[140px]" {...edit("works.title")}>
            {works.title}
          </h1>
        </section>
        <OurWorksGrid items={projects.map((p, i) => toPortfolioItem(content, p, i))} filters={works.filters} allLabel={works.allLabel} />
      </main>
      <SiteFooter />
    </>
  );
}
