"use client";

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const LOOP_SECONDS = 45; // time for one full lap when nobody touches it
const RELEASE_DELAY = 700; // a touched logo stays dark for a moment after the finger lifts
const DRAG_THRESHOLD = 4; // px before a press counts as a drag

/**
 * Endless logo strip: scrolls slowly to the left on its own, and can be dragged with
 * the mouse or swiped with a finger in either direction (it keeps going afterwards).
 * `children` must be two identical halves so moving by half its width loops seamlessly.
 * On touch screens the logo under the finger gets `data-lit` (there is no hover).
 */
export function LogoStrip({ children, className }: { children: ReactNode; className?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offset = useRef(0);
  const half = useRef(0);
  const drag = useRef<{ id: number; startX: number; startOffset: number; moved: boolean } | null>(null);
  const lit = useRef<HTMLElement | null>(null);
  const litTimer = useRef<number | undefined>(undefined);

  const wrap = (x: number) => {
    const h = half.current;
    if (!h) return x;
    return ((x % h) - h) % h; // keeps x in (-h, 0]
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => (half.current = track.scrollWidth / 2);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!drag.current && !still && half.current) offset.current = wrap(offset.current - (half.current / LOOP_SECONDS) * dt);
      track.style.transform = `translate3d(${offset.current}px, 0, 0)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  /* Touch highlight */
  const light = (x: number, y: number) => {
    window.clearTimeout(litTimer.current);
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-logo]") ?? null;
    if (el === lit.current) return;
    lit.current?.removeAttribute("data-lit");
    el?.setAttribute("data-lit", "");
    lit.current = el;
  };
  const unlight = () => {
    window.clearTimeout(litTimer.current);
    litTimer.current = window.setTimeout(() => {
      lit.current?.removeAttribute("data-lit");
      lit.current = null;
    }, RELEASE_DELAY);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { id: e.pointerId, startX: e.clientX, startOffset: offset.current, moved: false };
    if (e.pointerType !== "mouse") light(e.clientX, e.clientY);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") light(e.clientX, e.clientY);
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > DRAG_THRESHOLD) {
      d.moved = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // pointer already gone
      }
    }
    if (d.moved) offset.current = wrap(d.startOffset + dx);
  };

  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id === e.pointerId) drag.current = null;
    if (e.pointerType !== "mouse") unlight();
  };

  return (
    <div
      className={cn("cursor-grab select-none active:cursor-grabbing", className)}
      style={{ touchAction: "pan-y" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onPointerLeave={(e) => e.pointerType !== "mouse" && unlight()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div ref={trackRef} className="flex w-max items-center will-change-transform">
        {children}
      </div>
    </div>
  );
}
