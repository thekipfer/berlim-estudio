"use client";

import Image from "next/image";
import { useState } from "react";
import { Lightbox } from "@/components/lightbox";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";
import type { GalleryImage } from "@/types/content";
import { editPhotos } from "@/lib/editable";

const COLUMNS = 3;
const columnDelay = ["delay-150", "delay-300", "delay-450"];

/** Isotope-style masonry: each image goes into the currently shortest column. */
function toColumns(images: GalleryImage[]) {
  const columns: { image: GalleryImage; index: number }[][] = Array.from({ length: COLUMNS }, () => []);
  const heights = new Array<number>(COLUMNS).fill(0);
  images.forEach((image, index) => {
    const shortest = heights.indexOf(Math.min(...heights));
    columns[shortest].push({ image, index });
    heights[shortest] += image.height / image.width;
  });
  return columns;
}

function GalleryItem({
  image,
  index,
  delay,
  onOpen,
}: {
  image: GalleryImage;
  index: number;
  delay?: string;
  onOpen: (index: number) => void;
}) {
  return (
    <Reveal
      offset="30%"
      className={cn("transition-opacity duration-600 ease-reveal", delay)}
      hiddenClassName="smoove:opacity-0"
    >
      <button
        type="button"
        onClick={() => onOpen(index)}
        aria-label={`Open image ${index + 1}`}
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-[15px]"
      >
        <Image
          src={image.src}
          alt=""
          width={image.width}
          height={image.height}
          sizes="(min-width: 768px) 33vw, 100vw"
          className="block h-auto w-full transition-transform duration-[1.5s] ease-out group-hover:scale-110"
        />
        <span className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-1000 ease-[cubic-bezier(0,1,0.5,1)] group-hover:opacity-100" />
      </button>
    </Reveal>
  );
}

/** 3-column masonry gallery (1 column on mobile) that opens a lightbox. */
export function ProjectGallery({ images, editPath }: { images: GalleryImage[]; editPath: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const columns = toColumns(images);

  return (
    <section className="px-[30px]" {...editPhotos(editPath, "Editar galeria")}>
      {/* Mobile: single column in original order */}
      <div className="flex flex-col gap-[30px] tab:hidden">
        {images.map((image, index) => (
          <GalleryItem key={image.src} image={image} index={index} onOpen={setOpen} />
        ))}
      </div>

      {/* Tablet/desktop: masonry columns */}
      <div className="hidden gap-[30px] tab:flex">
        {columns.map((column, c) => (
          <div key={c} className="flex min-w-0 flex-1 flex-col gap-[30px]">
            {column.map(({ image, index }) => (
              <GalleryItem key={image.src} image={image} index={index} delay={columnDelay[c]} onOpen={setOpen} />
            ))}
          </div>
        ))}
      </div>

      <Lightbox images={images} index={open} onClose={() => setOpen(null)} onIndexChange={setOpen} />
    </section>
  );
}
