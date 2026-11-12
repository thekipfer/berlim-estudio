"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useContent } from "@/components/content-provider";
import { edit, editImage } from "@/lib/editable";

const PARALLAX_SPEED = 0.8; // jarallax speed: 0 = scrolls with page, 1 = fixed
const FADE_VELOCITY = 0.2; // title moves up 0.2px per px scrolled

/**
 * Full-height cover with a parallax background and the "About Us" title
 * bottom-left. The title drifts up and fades out as the page scrolls.
 */
export function AboutHero() {
  const { about } = useContent();
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const height = sectionRef.current?.offsetHeight ?? 0;
      if (imageRef.current && y <= height) {
        imageRef.current.style.transform = `translate3d(0, ${y * PARALLAX_SPEED}px, 0)`;
      }
      if (titleRef.current) {
        titleRef.current.style.transform = `translateY(${-FADE_VELOCITY * y}px)`;
        titleRef.current.style.opacity = String(Math.max(0, (100 - y / 4) / 100));
      }
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative flex h-screen min-h-[500px] items-end overflow-hidden" {...editImage("about.heroImage")}>
      <div ref={imageRef} className="absolute inset-0 will-change-transform">
        <Image src={about.heroImage} alt="" fill preload sizes="100vw" className="object-cover object-center" />
      </div>
      {/* Elementor background overlay: #000 at 20% */}
      <div className="absolute inset-0 bg-black opacity-20" />

      <div className="relative mx-auto w-full max-w-[1140px]">
        <div className="flex justify-center px-5 pb-5 tab:pb-[30px] desk:justify-start desk:px-0 desk:pb-10">
          <div ref={titleRef} className="w-full text-center tab:w-[80%] desk:w-[70%] desk:text-left">
            <h1 className="font-heading text-[36px] leading-[1.3] font-semibold tracking-[-1px] text-white tab:text-[44px] tab:leading-[1.1] desk:text-[60px]" {...edit("about.heroTitle")}>
              {about.heroTitle}
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
}
