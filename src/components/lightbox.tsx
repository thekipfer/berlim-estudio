"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/icons";
import type { GalleryImage } from "@/types/content";

interface LightboxProps {
  images: GalleryImage[];
  /** Index of the open image, or null when closed. */
  index: number | null;
  /** Describes the project; each photo adds its number. */
  alt?: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

const controlClass =
  "flex size-11 cursor-pointer items-center justify-center rounded-full text-black transition-colors duration-200 hover:bg-black/5";

/** Full-screen image viewer (white "metro" style like the theme's ModuloBox). */
export function Lightbox({ images, index, alt = "", onClose, onIndexChange }: LightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = index !== null;
  const count = images.length;

  useEffect(() => {
    if (index === null) return;
    const returnFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange((index + 1) % count);
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + count) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      returnFocus?.focus();
    };
  }, [index, count]);

  if (!open) return null;
  const image = images[index];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visualizador de fotos"
      className="fixed inset-0 z-[1000] animate-[works-in_0.3s_ease-out] bg-white"
      onClick={onClose}
    >
      <div className="absolute top-0 left-0 z-10 flex w-full items-center justify-between p-3 tab:p-5">
        <span className="pl-2 text-sm text-black/60 tabular-nums">
          {index + 1} / {count}
        </span>
        <button
          ref={closeRef}
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className={controlClass}
        >
          <CloseIcon className="size-6" />
        </button>
      </div>

      <div className="absolute inset-0 flex items-center justify-center px-4 py-20 tab:px-24">
        <Image
          key={image.src}
          src={image.src}
          alt={alt && index !== null ? `${alt} (foto ${index + 1})` : ""}
          width={image.width}
          height={image.height}
          sizes="100vw"
          onClick={(e) => e.stopPropagation()}
          className="h-auto max-h-full w-auto max-w-full animate-[works-in_0.3s_ease-out] object-contain"
        />
      </div>

      <button
        type="button"
        aria-label="Foto anterior"
        onClick={(e) => {
          e.stopPropagation();
          onIndexChange((index - 1 + count) % count);
        }}
        className={`${controlClass} absolute top-1/2 left-2 -translate-y-1/2 tab:left-5`}
      >
        <ChevronLeftIcon className="size-7" />
      </button>
      <button
        type="button"
        aria-label="Próxima foto"
        onClick={(e) => {
          e.stopPropagation();
          onIndexChange((index + 1) % count);
        }}
        className={`${controlClass} absolute top-1/2 right-2 -translate-y-1/2 tab:right-5`}
      >
        <ChevronRightIcon className="size-7" />
      </button>
    </div>
  );
}
