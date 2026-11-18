import Image from "next/image";
import { getContent } from "@/lib/content-store";
import { LogoStrip } from "@/components/logo-strip";
import { editPhotos } from "@/lib/editable";

const MIN_ITEMS = 8; // repeat short lists so the strip never shows a gap

/*
 * Wide logos look bigger than squarer ones at the same height, so each logo's height
 * is scaled by its aspect ratio (wider → a bit shorter) to give them similar visual weight.
 * REFERENCE_RATIO is the width/height that keeps the base height.
 */
const REFERENCE_RATIO = 2.9;
const logoScale = (width?: number, height?: number) => {
  const ratio = width && height ? width / height : REFERENCE_RATIO;
  return Math.min(1.4, Math.max(0.7, Math.sqrt(REFERENCE_RATIO / ratio)));
};

/**
 * Client name from a readable file name ("/images/logos/duas-rodas.webp" → "Duas Rodas").
 * Uploaded files have random names, so they get no name (never guess a client).
 */
const SMALL_WORDS = new Set(["a", "e", "de", "da", "do", "das", "dos"]);
function clientName(src: string) {
  const m = src.match(/^\/images\/logos\/([^/]+)\.[a-z0-9]+$/i);
  if (!m) return "";
  return m[1]
    .replace(/[-_]+(trim|logo|branco|preto|white|black)$/i, "")
    .split(/[-_\s]+/)
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** Client logos in grayscale, gently faded, scrolling slowly to the left; can be dragged/swiped. Hover (or touch) darkens a logo. */
export async function LogoMarquee() {
  const { home } = await getContent();
  const logos = (home.logos ?? []).filter((l) => l?.src);
  if (logos.length === 0) return null;

  const repeat = Math.max(1, Math.ceil(MIN_ITEMS / logos.length));
  const strip = Array.from({ length: repeat }, () => logos).flat();

  return (
    <section
      aria-label="Clientes"
      className="overflow-hidden border-b border-black/5 bg-white py-10 tab:py-14"
      {...editPhotos("home.logos", "Editar logos")}
    >
      <LogoStrip className="[mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        {/* Two identical halves: moving by half the width loops seamlessly */}
        {[0, 1].map((half) => (
          <ul key={half} className="flex items-center" aria-hidden={half === 1}>
            {strip.map((logo, i) => (
              <li key={i} className="flex shrink-0 items-center px-8 tab:px-12">
                <Image
                  src={logo.src}
                  // Named once (first copy); the repeats that fill the strip stay silent.
                  alt={half === 0 && i < logos.length && clientName(logo.src) ? `Logo ${clientName(logo.src)}` : ""}
                  width={logo.width || 400}
                  height={logo.height || 160}
                  sizes="240px"
                  data-logo
                  draggable={false}
                  style={{ "--logo-scale": logoScale(logo.width, logo.height) * (logo.scale ?? 1) } as React.CSSProperties}
                  className="h-[calc(36px*var(--logo-scale))] w-auto max-w-[220px] object-contain opacity-45 mix-blend-multiply grayscale transition-[opacity,filter] duration-300 hover:opacity-100 hover:contrast-200 data-[lit]:opacity-100 data-[lit]:contrast-200 tab:h-[calc(44px*var(--logo-scale))] tab:max-w-[240px]"
                />
              </li>
            ))}
          </ul>
        ))}
      </LogoStrip>
    </section>
  );
}
