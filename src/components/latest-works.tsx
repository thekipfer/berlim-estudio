import Link from "next/link";
import { ArrowRightSolidIcon } from "@/components/icons";
import { WorkCard } from "@/components/work-card";
import { getContent } from "@/lib/content-store";
import { projectItems } from "@/lib/site";
import { edit, editLink } from "@/lib/editable";

/** "our latest works" title + 2-column portfolio grid + View all. */
export async function LatestWorks() {
  const content = await getContent();
  const { home } = content;
  const items = projectItems(content, home.works);

  return (
    <>
      <section className="pb-10 tab:pt-10 tab:pb-20">
        <h2 className="text-center font-heading text-[44px] leading-none lowercase tab:text-[80px] desk:text-[140px]" {...edit("home.worksTitle")}>
          {home.worksTitle}
        </h2>
      </section>

      <section>
        <div className="mx-auto max-w-[1140px]">
          <div className="px-5 tab:px-[30px] desk:px-0">
            <div className="flex flex-wrap justify-between">
              {items.map((item, i) => (
                <WorkCard key={item.href} item={item} index={i} />
              ))}
            </div>
            <div className="mt-5 text-center tab:mt-10 desk:mt-0">
              <Link
                href={home.worksCta.href}
                {...editLink("home.worksCta.href")}
                className="inline-flex anim-grow items-start rounded-[50px] bg-black px-[25px] py-[18px] text-[18px] leading-[18px] font-semibold text-white"
              >
                <span {...edit("home.worksCta.label")}>{home.worksCta.label}</span>
                <ArrowRightSolidIcon className="ml-[10px] h-[18px] w-[15.75px]" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
