import Image from "next/image";
import Link from "next/link";
import { getContent } from "@/lib/content-store";
import { cn } from "@/lib/utils";
import type { LinkItem, ServiceCard } from "@/types/content";
import { edit, editImage, editLink } from "@/lib/editable";

function FlipCard({ card, cta, tracking, index }: { card: ServiceCard; cta: LinkItem; tracking: boolean; index: number }) {
  const path = `home.serviceCards.${index}`;
  return (
    <div className="flip-box h-[400px] desk:h-[500px]" {...editImage(`${path}.image`)}>
      {/* Front */}
      <div className="flip-face flip-face--front">
        {card.video ? (
          // Muted + playsInline lets phones autoplay; the poster shows until it starts (or if autoplay is blocked).
          <video
            src={card.video}
            poster={card.image}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Image src={card.image} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
        )}
        <div className="flip-content flip-content--front">
          <h2 className="font-heading text-[24px] leading-[1.6] font-semibold text-white tab:text-[18px] desk:text-[30px]" {...edit(`${path}.title`)}>
            {card.title}
          </h2>
          <div
            className={cn(
              "mt-[10px] text-[13px] leading-none font-medium text-white uppercase desk:text-base",
              tracking ? "tracking-[1px]" : "tracking-normal",
            )}
            {...edit(`${path}.price`)}
          >
            {card.price}
          </div>
        </div>
        <div className="absolute top-0 left-0 h-full w-full bg-black/20" />
      </div>

      {/* Back */}
      <div className="flip-face flip-face--back">
        <Image src={card.image} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
        <div className="flip-content flip-content--back">
          <Link
            href={cta.href}
            {...editLink("home.serviceCta.href")}
            {...edit("home.serviceCta.label")}
            className="mt-5 inline-block rounded-[25px] border-2 border-white bg-white px-[1.8em] pt-[0.6em] pb-[0.5em] font-sans text-[18px] leading-[1.5] font-semibold text-black hover:text-[#222]"
          >
            {cta.label}
          </Link>
        </div>
        <div className="absolute top-0 left-0 h-full w-full bg-black/20" />
      </div>
    </div>
  );
}

/* Column paddings of the original 3-up layout (first / middle / last). */
const columnClass = [
  "px-5 pb-10 tab:w-1/3 tab:px-0 tab:pr-5 tab:pb-0 desk:pr-[30px]",
  "px-5 pb-10 tab:w-1/3 tab:px-[10px] tab:pb-0 desk:px-[15px]",
  "px-5 tab:w-1/3 tab:px-0 tab:pl-5 desk:pl-[30px]",
];

/** Pricing cards that flip in 3D on hover. */
export async function ServiceFlipCards() {
  const { home } = await getContent();
  const cards = home.serviceCards;
  return (
    <section className="pb-[60px] tab:pb-[100px]">
      <div className="mx-auto flex max-w-[1140px] flex-col flex-wrap tab:flex-row">
        {cards.map((card, i) => {
          const position = i === 0 ? 0 : i === cards.length - 1 ? 2 : 1;
          return (
            <div key={i} className={cn(columnClass[position], i >= 3 && "tab:mt-10")}>
              <FlipCard card={card} cta={home.serviceCta} tracking={i === 2} index={i} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
