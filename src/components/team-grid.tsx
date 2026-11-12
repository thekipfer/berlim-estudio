"use client";

import Image from "next/image";
import { useRef, type MouseEvent } from "react";
import { Reveal } from "@/components/reveal";
import { useContent } from "@/components/content-provider";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/types/content";
import { edit, editImage } from "@/lib/editable";

/* tilt.jquery settings used by the theme */
const MAX_TILT = 20;
const PERSPECTIVE = 2000;
const MAX_GLARE = 0.5;
const EASE = "cubic-bezier(.03,.98,.52,.99)";
const CLIP_TRANSITION = "clip-path .8s cubic-bezier(.23,1,.32,1)";

const delays = ["delay-150", "delay-300", "delay-450", "delay-600"];

function canTilt() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/** Safari renders the scaled tilt blurry, so the theme keeps scale at 1 there. */
function tiltScale() {
  const ua = navigator.userAgent;
  return ua.includes("Safari") && !ua.includes("Chrome") ? 1 : 1.1;
}

function TeamCard({ member, index }: { member: TeamMember; index: number }) {
  const tiltRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const setTransition = (on: boolean) => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.transition = on ? `transform 400ms ${EASE}, ${CLIP_TRANSITION}` : CLIP_TRANSITION;
    if (glareRef.current) glareRef.current.style.transition = on ? `opacity 400ms ${EASE}` : "";
  };

  const onEnter = () => {
    if (!canTilt()) return;
    setTransition(true);
    window.setTimeout(() => setTransition(false), 400);
  };

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = tiltRef.current;
    if (!el || !canTilt()) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const tiltX = MAX_TILT / 2 - px * MAX_TILT;
    const tiltY = py * MAX_TILT - MAX_TILT / 2;
    const angle =
      Math.atan2(e.clientX - (rect.left + rect.width / 2), -(e.clientY - (rect.top + rect.height / 2))) *
      (180 / Math.PI);
    const s = tiltScale();
    el.style.transform = `perspective(${PERSPECTIVE}px) rotateX(${tiltY}deg) rotateY(${tiltX}deg) scale3d(${s},${s},${s})`;
    if (glareRef.current) {
      glareRef.current.style.transform = `rotate(${angle}deg) translate(-50%, -50%)`;
      glareRef.current.style.opacity = String(py * MAX_GLARE);
    }
  };

  const onLeave = () => {
    const el = tiltRef.current;
    if (!el) return;
    setTransition(true);
    el.style.transform = `perspective(${PERSPECTIVE}px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)`;
    if (glareRef.current) glareRef.current.style.opacity = "0";
  };

  return (
    <Reveal
      offset="10%"
      className={cn(
        "team-card group mb-5 w-full transition-all duration-1200 ease-smoove tab:w-[48%] min-[961px]:w-[22.75%] desk:mb-10",
        delays[index % delays.length],
      )}
      hiddenClassName="desk:translate-y-[45px] desk:opacity-0"
    >
      <div
        ref={tiltRef}
        onMouseEnter={onEnter}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="team-card__img relative overflow-hidden leading-none"
        {...editImage(`about.team.${index}.image`)}
      >
        <Image
          src={member.image}
          alt={member.name}
          width={600}
          height={600}
          sizes="(min-width: 1025px) 260px, (min-width: 961px) 22vw, (min-width: 768px) 48vw, 100vw"
          className="block h-auto w-full"
        />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            ref={glareRef}
            className="absolute top-1/2 left-1/2 h-[200%] w-[200%] origin-top-left opacity-0"
            style={{
              transform: "rotate(180deg) translate(-50%, -50%)",
              backgroundImage: "linear-gradient(0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)",
            }}
          />
        </div>
      </div>

      {/* pb-[30px] = 20px padding + the original's empty 10px description line */}
      <div className="pt-5 pb-[30px]">
        <h3 className="font-heading text-2xl leading-[1.5] font-bold text-black" {...edit(`about.team.${index}.name`)}>
          {member.name}
        </h3>
        <div className="text-base text-black" {...edit(`about.team.${index}.role`)}>
          {member.role}
        </div>
      </div>
    </Reveal>
  );
}

/** 4-column team grid (2 columns 768–960px, 1 column on phones). */
export function TeamGrid() {
  const { about } = useContent();
  return (
    <section className="pb-5 desk:pb-10">
      <div className="mx-auto max-w-[1140px] px-5 tab:pr-5 tab:pl-[30px] desk:px-0">
        <div className="flex flex-wrap tab:gap-x-[4%] min-[961px]:gap-x-[3%]">
          {about.team.map((member, i) => (
            <TeamCard key={i} member={member} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
