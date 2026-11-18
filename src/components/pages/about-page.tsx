import Image from "next/image";
import Link from "next/link";
import { AboutHero } from "@/components/about-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TeamGrid } from "@/components/team-grid";
import { getContent } from "@/lib/content-store";
import { cn } from "@/lib/utils";
import type { AboutFeature } from "@/types/content";
import { edit, editImage, editLink } from "@/lib/editable";

function FeatureText({ feature, side, index }: { feature: AboutFeature; side: "left" | "right"; index: number }) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center px-5 pt-10 tab:w-1/2 tab:items-start tab:pt-0 tab:pr-0 tab:pl-5",
        side === "left" ? "desk:pr-20 desk:pl-0" : "desk:pl-20",
      )}
    >
      <h2 className="w-full text-center font-heading text-[28px] leading-[1.2] tab:w-[90%] tab:text-left tab:text-[30px] desk:w-[70%] desk:text-[38px]" {...edit(`about.features.${index}.title`)}>
        {feature.title}
      </h2>
      <div className="mt-5 w-full text-center tab:w-[90%] tab:text-left desk:w-[80%]">
        <p {...edit(`about.features.${index}.text`)}>{feature.text}</p>
      </div>
      {feature.cta?.label && (
        <div className="mt-10 w-full text-center tab:w-[90%] tab:text-left desk:w-[80%]">
          <Link
            href={feature.cta.href || "/"}
            {...editLink(`about.features.${index}.cta.href`)}
            {...edit(`about.features.${index}.cta.label`)}
            className="inline-block anim-grow rounded-[50px] bg-black px-[25px] py-[18px] text-center text-[18px] leading-[18px] font-semibold text-white"
          >
            {feature.cta.label}
          </Link>
        </div>
      )}
    </div>
  );
}

function FeatureImage({ feature, side, index }: { feature: AboutFeature; side: "left" | "right"; index: number }) {
  return (
    <div
      className={cn("w-full px-5 tab:w-1/2", side === "left" ? "desk:pr-5 desk:pl-0" : "desk:pr-0 desk:pl-5")}
      {...editImage(`about.features.${index}.image`)}
    >
      <Image
        src={feature.image}
        alt={feature.title}
        width={feature.width}
        height={feature.height}
        sizes="(min-width: 1025px) 550px, (min-width: 768px) 50vw, 100vw"
        className="block h-auto w-full rounded-[15px]"
      />
    </div>
  );
}

export async function AboutPage() {
  const { about } = await getContent();

  return (
    <>
      <SiteHeader centerLogo />
      <main>
        <AboutHero />

        <section className="py-[60px] desk:py-[100px]">
          <div className="mx-auto max-w-[1140px] px-5 tab:px-[100px] desk:px-0">
            <h2 className="text-center font-heading text-[26px] leading-[1.4] tab:text-[30px] tab:leading-[1.3] desk:text-left desk:text-[36px]" {...edit("about.intro")}>
              {about.intro}
            </h2>
          </div>
        </section>

        {/* Features alternate sides: text/photo, then photo/text. Photo comes first on phones for even rows. */}
        {about.features.map((feature, i) =>
          i % 2 === 0 ? (
            <section key={i} className="mb-10">
              <div className="mx-auto flex max-w-[1140px] flex-col-reverse tab:flex-row tab:items-center">
                <FeatureText feature={feature} side="left" index={i} />
                <FeatureImage feature={feature} side="right" index={i} />
              </div>
            </section>
          ) : (
            <section key={i} className="mb-10">
              {/* Photo above the text on phones, photo left on larger screens */}
              <div className="mx-auto flex max-w-[1140px] flex-col tab:flex-row tab:items-center">
                <FeatureImage feature={feature} side="left" index={i} />
                <FeatureText feature={feature} side="right" index={i} />
              </div>
            </section>
          ),
        )}

        {!about.teamHidden && (
          <>
            <section className="pt-[30px] pb-10 tab:pt-10 desk:pt-[60px]">
              <h2 className="text-center font-heading text-[40px] leading-none lowercase tab:text-[80px] desk:text-[140px]" {...edit("about.teamTitle")}>
                {about.teamTitle}
              </h2>
            </section>

            <TeamGrid />
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
