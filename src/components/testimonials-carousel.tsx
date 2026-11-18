"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useContent } from "@/components/content-provider";
import { cn } from "@/lib/utils";
import type { Testimonial } from "@/types/content";
import { edit, editImage, editLink } from "@/lib/editable";

const SPEED = 450; // owl smartSpeed

/** Owl responsive config: 0 → 1 item, 768 → 2, 1170 → 3 (based on window width). */
function itemsFor(width: number) {
  if (width >= 1170) return 3;
  if (width >= 768) return 2;
  return 1;
}

function Card({ t, index }: { t: Testimonial; index: number }) {
  const path = `home.testimonials.${index}`;
  return (
    <div className="rounded-[15px] bg-white p-10 text-center shadow-[0_35px_60px_rgba(0,0,0,0.1)]">
      <div className="mb-5 text-base leading-[1.6] font-medium desk:text-[20px]" {...edit(`${path}.quote`)}>
        {t.quote}
      </div>
      <div className="inline-block align-middle" {...editImage(`${path}.avatar`)}>
        <Image
          src={t.avatar}
          alt={t.name}
          width={150}
          height={150}
          className="mr-[10px] max-w-[40px] rounded-[50px]"
          draggable={false}
        />
      </div>
      <div className="inline-block text-sm leading-[1.6]">
        <span {...edit(`${path}.name`)}>{t.name}</span>
        {t.company &&
          (t.companyHref ? (
            <a href={t.companyHref} target="_blank" rel="noreferrer" {...editLink(`${path}.companyHref`)} {...edit(`${path}.company`)}>
              {t.company}
            </a>
          ) : (
            t.company
          ))}
      </div>
    </div>
  );
}

/** Centered, looping testimonial carousel (Owl Carousel `center: true, loop: true`), drag to navigate. */
export function TestimonialsCarousel() {
  const { home } = useContent();
  const testimonials = home.testimonials;
  const COUNT = testimonials.length;
  // Three copies so the centered loop always has neighbours on both sides.
  const LOOP = [...testimonials, ...testimonials, ...testimonials];
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1440);
  const [perView, setPerView] = useState(3);
  const [index, setIndex] = useState(COUNT); // first real item, centered
  const [animate, setAnimate] = useState(false);
  const [drag, setDrag] = useState(0);
  const dragState = useRef<{ x: number; id: number; moved: boolean } | null>(null);

  useEffect(() => {
    const measure = () => {
      setWidth(wrapRef.current?.offsetWidth ?? window.innerWidth);
      setPerView(itemsFor(window.innerWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const itemWidth = width / perView;
  const offset = -index * itemWidth + (width - itemWidth) / 2 + drag;

  // After animating into a cloned copy, jump back to the middle copy without animation.
  useEffect(() => {
    if (!animate) return;
    const t = window.setTimeout(() => {
      setAnimate(false);
      setIndex((i) => (i < COUNT ? i + COUNT : i >= COUNT * 2 ? i - COUNT : i));
    }, SPEED);
    return () => window.clearTimeout(t);
  }, [animate, index, COUNT]);

  const goTo = useCallback(
    (next: number) => {
      setAnimate(true);
      setIndex(Math.max(0, Math.min(COUNT * 3 - 1, next)));
    },
    [COUNT],
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragState.current = { x: e.clientX, id: e.pointerId, moved: false };
    setAnimate(false);
    setIndex((i) => (i < COUNT ? i + COUNT : i >= COUNT * 2 ? i - COUNT : i));
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = dragState.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    if (!s.moved && Math.abs(dx) > 3) {
      s.moved = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Pointer already released; dragging still works without capture.
      }
    }
    if (!s.moved) return;
    // The carousel is scaled 1.2, so convert screen px to layout px.
    setDrag(dx / 1.2);
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = dragState.current;
    if (!s || s.id !== e.pointerId) return;
    dragState.current = null;
    if (!s.moved) return;
    const dx = drag;
    setDrag(0);
    // Owl snaps back under a 30px pull, otherwise to the closest item in the drag direction.
    if (Math.abs(dx) < 30) {
      goTo(index);
      return;
    }
    const steps = Math.max(1, Math.round(Math.abs(dx) / itemWidth));
    goTo(index + (dx < 0 ? steps : -steps));
  };

  if (COUNT === 0) return null;

  return (
    <section className="overflow-x-clip pt-0 tab:pt-10 desk:py-[60px]">
      <div ref={wrapRef} className="w-full">
        <div className="relative scale-[1.2] select-none">
          <div className="relative overflow-hidden">
            <div
              className={cn(
                "flex touch-pan-y cursor-grab items-start active:cursor-grabbing",
                animate && "transition-transform ease-[ease]",
                animate && "duration-450",
              )}
              style={{ transform: `translate3d(${offset}px, 0, 0)`, width: LOOP.length * itemWidth }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {LOOP.map((t, i) => {
                const isCenter = i === index;
                return (
                  <div key={i} className="shrink-0" style={{ width: itemWidth }} aria-hidden={!isCenter}>
                    <div
                      className={cn(
                        "my-20 text-center transition-all duration-300 ease-in-out",
                        isCenter ? "scale-100 opacity-100" : "scale-90 opacity-20",
                      )}
                    >
                      <Card t={t} index={i % COUNT} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Owl's empty (disabled) dots container still occupies one line box. */}
          <div className="h-[25.6px]" />
        </div>
      </div>
    </section>
  );
}
