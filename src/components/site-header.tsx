"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useContent } from "@/components/content-provider";
import { MenuJustifyIcon } from "@/components/icons";
import { MobileMenu } from "@/components/mobile-menu";
import { useScrollPast } from "@/hooks/use-scroll-past";
import { cn } from "@/lib/utils";
import { edit, editImage, editLink } from "@/lib/editable";

type Tone = "light" | "dark";

function MainNav({ tone }: { tone: Tone }) {
  const { nav } = useContent();
  return (
    <nav className="h-[51.6px]" aria-label="Main">
      {/* gap = the whitespace between the theme's inline-block <li>s */}
      <ul className="flex gap-x-[4.4px] pt-[19px]">
        {nav.items.map((item, i) => (
          <li key={i} className="mx-5">
            <a
              href={item.href}
              {...editLink(`nav.items.${i}.href`)}
              className={cn(
                "relative block text-base leading-4 font-semibold transition-[padding] duration-300",
                tone === "light" ? "text-white hover:text-white/73" : "text-black hover:text-black/64",
              )}
            >
              <span {...edit(`nav.items.${i}.label`)}>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ContactButton({ tone }: { tone: Tone }) {
  const { nav } = useContent();
  return (
    <Link
      href={nav.contact.href}
      {...editLink("nav.contact.href")}
      className={cn(
        "inline-block rounded-[50px] px-[25px] py-[13px] text-center text-base leading-4 font-semibold transition-transform duration-300",
        tone === "light" ? "bg-white text-black" : "bg-black text-white",
      )}
    >
      <span {...edit("nav.contact.label")}>{nav.contact.label}</span>
    </Link>
  );
}

function Hamburger({ tone, onClick, className }: { tone: Tone; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open menu"
      className={cn(
        "flex cursor-pointer items-start pt-px leading-none",
        tone === "light" ? "text-white" : "text-black",
        className,
      )}
    >
      <MenuJustifyIcon className="block size-[1em]" />
    </button>
  );
}

function WhiteBar({ onMenu, className }: { onMenu: () => void; className?: string }) {
  const { brand } = useContent();
  return (
    <div className={cn("py-5 desk:py-[10px]", className)}>
      <div className="mx-auto flex max-w-[1140px]">
        <div className="flex w-[60%] items-center pl-5 tab:w-[30%] desk:pl-0">
          <Link href="/" className="inline-block" {...editImage("brand.logoBar")}>
            <Image
              src={brand.logoBar}
              alt="Berlim Estúdio"
              width={1000}
              height={179}
              sizes="150px"
              className="h-auto w-[140px] tab:w-[150px]"
            />
          </Link>
        </div>
        <div className="flex w-[40%] items-center justify-end pr-5 tab:w-[70%] desk:pr-0">
          <div className="hidden desk:block">
            <MainNav tone="dark" />
          </div>
          <div className="ml-[10px] hidden tab:block">
            <ContactButton tone="dark" />
          </div>
          <Hamburger
            tone="dark"
            onClick={onMenu}
            className="mt-[7px] text-[18px] tab:mt-2 tab:ml-5 desk:hidden"
          />
        </div>
      </div>
    </div>
  );
}

interface SiteHeaderProps {
  /** "hero": transparent header over the home slideshow. "page": static white bar (inner pages). */
  variant?: "hero" | "page";
  /** Hero only: put the big logo in the middle of the screen instead of under the menu. */
  centerLogo?: boolean;
}

export function SiteHeader({ variant = "hero", centerLogo = false }: SiteHeaderProps) {
  const { brand } = useContent();
  const scrolled = useScrollPast(100);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // The theme reveals the transparent header 200ms after load.
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 200);
    return () => window.clearTimeout(t);
  }, []);

  const mainVisible = ready && !scrolled;

  return (
    <>
      {variant === "page" ? (
        <header className="relative z-[5] bg-white">
          <WhiteBar onMenu={() => setMenuOpen(true)} />
        </header>
      ) : (
        <>
          {/* Transparent header over the hero: nav + CTA + giant logo */}
          <header
            inert={!mainVisible}
            className={cn(
              "fixed top-0 left-0 w-full",
              // Centered logo: the header covers the screen but only its links/buttons take clicks.
              centerLogo && "h-svh pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto",
              mainVisible ? "z-[9] opacity-100" : "pointer-events-none -z-10 opacity-0",
            )}
          >
            <div className="flex justify-end pt-5 pr-5 desk:hidden">
              <Hamburger
                tone="light"
                onClick={() => setMenuOpen(true)}
                className="mt-[7px] h-[26px] text-[18px] tab:mt-2 tab:ml-5 tab:h-[29px] tab:text-[22px]"
              />
            </div>
            <div className="pb-10 desk:py-10">
              <div className="mx-auto flex max-w-[1140px] flex-wrap justify-center">
                <div className="hidden desk:block">
                  <MainNav tone="light" />
                </div>
                <div className="mt-[5px] ml-[10px] hidden desk:block">
                  <ContactButton tone="light" />
                </div>
                <div
                  className={cn(
                    "w-full text-center",
                    centerLogo ? "absolute inset-0 flex items-center justify-center px-5" : "desk:mt-6",
                  )}
                >
                  <Link href="/" className="inline-block" {...editImage("brand.logoHero")}>
                    <Image
                      src={brand.logoHero}
                      alt="Berlim Estúdio"
                      width={1000}
                      height={340}
                      preload
                      sizes="(min-width: 1025px) 560px, (min-width: 768px) 440px, 240px"
                      className="inline-block h-auto w-[240px] tab:w-[440px] desk:w-[560px]"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </header>
        </>
      )}

      {/* Sticky white bar shown after 100px of scroll */}
      <div
        inert={!scrolled}
        className={cn(
          "fixed top-0 left-0 w-full transition-all duration-200 ease-out",
          scrolled ? "z-[4] translate-y-0 opacity-100" : "pointer-events-none -z-10 -translate-y-[140px] opacity-0",
        )}
      >
        <WhiteBar onMenu={() => setMenuOpen(true)} className="bg-white/79 backdrop-blur-[12px]" />
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
