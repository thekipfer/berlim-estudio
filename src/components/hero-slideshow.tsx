"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useContent } from "@/components/content-provider";
import { cn } from "@/lib/utils";
import { editPhotos } from "@/lib/editable";

const SLIDE_DURATION = 1800; // time each photo stays still
const TRANSITION_DURATION = 1200; // slow dissolve into the next photo (3s per photo in total)

/**
 * One set of photos dissolving into each other (Swiper "fade" effect, no crossfade):
 * the incoming slide fades in on top of the outgoing one.
 */
function SlideLayer({
  slides,
  preloadFirst,
  className,
  marker,
}: {
  slides: string[];
  preloadFirst: boolean;
  className?: string;
  /** In-page editor marker (editPhotos). */
  marker?: Record<string, string>;
}) {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = window.setTimeout(() => {
      setPrev(active);
      setActive((active + 1) % slides.length);
    }, SLIDE_DURATION + TRANSITION_DURATION);
    return () => window.clearTimeout(t);
  }, [active, slides.length]);

  return (
    <div className={cn("absolute inset-0", className)} {...marker}>
      {slides.map((src, i) => {
        const isActive = i === active % slides.length;
        const isPrev = i === prev;
        return (
          <div
            key={`${i}-${src}`}
            aria-hidden={!isActive}
            className={cn(
              "absolute inset-0",
              isActive && "z-[2] opacity-100 transition-opacity duration-1200 ease-in-out",
              isPrev && !isActive && "z-[1] opacity-100",
              !isActive && !isPrev && "z-0 opacity-0",
            )}
          >
            {/* Lazy images inside a hidden layer (desktop set on phones, or the reverse) never download. */}
            <Image
              src={src}
              alt=""
              fill
              sizes="100vw"
              preload={preloadFirst && i === 0}
              loading={preloadFirst && i === 0 ? undefined : "lazy"}
              className="object-cover object-center"
            />
          </div>
        );
      })}
    </div>
  );
}

/** Full-viewport background slideshow. Phones get their own photos when the editor has them. */
export function HeroSlideshow() {
  const { home } = useContent();
  const desktop = home.slides.filter(Boolean);
  const mobile = (home.slidesMobile ?? []).filter(Boolean);
  const hasMobile = mobile.length > 0;

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black" aria-label="Fotos em destaque">
      <SlideLayer
        slides={desktop}
        preloadFirst={!hasMobile}
        className={hasMobile ? "hidden tab:block" : undefined}
        marker={editPhotos("home.slides", hasMobile ? "Editar slides (desktop)" : "Editar slides")}
      />
      {hasMobile && (
        <SlideLayer
          slides={mobile}
          preloadFirst={false}
          className="tab:hidden"
          marker={editPhotos("home.slidesMobile", "Editar slides (celular)")}
        />
      )}
      {/* Elementor background overlay: #000 at 20% */}
      <div className="pointer-events-none absolute inset-0 z-[3] bg-black opacity-20" />
    </section>
  );
}
