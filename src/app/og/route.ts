import sharp from "sharp";
import type { NextRequest } from "next/server";

/*
 * Social preview image (WhatsApp, LinkedIn, Facebook, X): a site photo cropped to 1200×630 JPEG.
 * Photos are WebP, which some previews don't read. Only the site's own images are accepted.
 */

const LOCAL = /^\/(images|uploads|videos)\/[^?#]+\.(jpe?g|png|webp|avif)$/i;
const BLOB_HOST = /\.public\.blob\.vercel-storage\.com$/;

function sourceUrl(src: string, origin: string) {
  if (LOCAL.test(src) && !src.includes("..")) return new URL(src, origin);
  try {
    const url = new URL(src);
    return url.protocol === "https:" && BLOB_HOST.test(url.hostname) ? url : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const url = sourceUrl(request.nextUrl.searchParams.get("src") ?? "", request.nextUrl.origin);
  if (!url) return new Response("Imagem inválida", { status: 400 });

  const res = await fetch(url);
  if (!res.ok) return new Response("Imagem não encontrada", { status: 404 });

  const jpeg = await sharp(Buffer.from(await res.arrayBuffer()))
    .rotate()
    .resize(1200, 630, { fit: "cover", position: sharp.strategy.attention })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400",
    },
  });
}
