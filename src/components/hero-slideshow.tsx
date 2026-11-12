"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useContent } from "@/components/content-provider";
import { cn } from "@/lib/utils";
import { editPhotos } from "@/lib/editable";

const SLIDE_DURATION = 1800; // time each photo stays still
const TRANSITION_DURATION = 1200; // slow dissolve into the next photo (3s per photo in total)

/**
 * Full-viewport background slideshow (Swiper "fade" effect, no crossfade):
 * the incoming slide fades in on top of the outgoing one. Photos come from the editor.
 */
export function HeroSlideshow() {
  const { home } = useContent();
  const slides = home.slides.filter(Boolean);
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
    <section
      className="relative h-screen w-full overflow-hidden bg-black"
      aria-label="Featured photography"
      {...editPhotos("home.slides", "Editar slides")}
    >
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
            <Image
              src={src}
              alt=""
              fill
              sizes="100vw"
              preload={i === 0}
              loading={i === 0 ? undefined : "eager"}
              className="object-cover object-center"
            />
          </div>
        );
      })}
      {/* Elementor background overlay: #000 at 20% */}
      <div className="absolute inset-0 z-[3] bg-black opacity-20" />
    </section>
  );
}
