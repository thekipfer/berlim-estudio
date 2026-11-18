import Image from "next/image";
import Link from "next/link";
import { ThinArrowRightIcon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";
import type { PortfolioItem } from "@/types/content";
import { edit, editImage } from "@/lib/editable";

/** Portfolio card: rounded photo + caption that slides up on hover. */
export function WorkCard({ item, index }: { item: PortfolioItem; index: number }) {
  const isRight = index % 2 === 1;
  const path = item.editPath;
  return (
    <Reveal
      offset="30%"
      className={cn(
        "work-card relative mb-20 w-full transition-all duration-600 ease-reveal tab:mb-[8%] tab:w-[calc(50%-25px)]",
        isRight ? "delay-300" : "delay-150",
      )}
      hiddenClassName="smoove:opacity-0"
    >
      <div
        className="relative aspect-[1024/682] overflow-hidden rounded-[15px]"
        data-edit-nav={item.href}
        {...(path ? editImage(`${path}.image`) : {})}
      >
        <Image
          src={item.image}
          alt={`${item.title}${item.category ? ` – ${item.category}` : ""}`}
          fill
          sizes="(min-width: 1025px) 545px, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="work-caption">
        <h3 className="font-heading text-[22px] leading-[1.3] font-bold desk:text-[26px] desk:leading-[1.4]" {...(path ? edit(`${path}.title`) : {})}>
          {item.title}
        </h3>
        <div className="text-sm leading-[2] text-muted-text lowercase desk:leading-[1.6]" {...(path ? edit(`${path}.category`) : {})}>
          {item.category}
        </div>
        <div className="work-arrow flex h-8 items-center text-[20px]">
          <ThinArrowRightIcon className="size-5" />
        </div>
      </div>
      <Link href={item.href} className="edit-passthrough absolute inset-0 z-[3]" aria-label={item.title} />
    </Reveal>
  );
}
