import sharp from "sharp";

/*
 * Compresses an uploaded image before it is stored (server-only).
 * - Rotates phone photos upright and strips metadata (GPS, camera).
 * - Fits inside 2400×2400 without enlarging.
 * - Photos → WebP quality 82 (visually identical, ~60–80% smaller).
 * - Images with transparency (logos) → lossless WebP, so edges stay crisp.
 * - GIFs are kept as they are (animation).
 */

const MAX_SIDE = 2400;

export interface OptimizedImage {
  data: Buffer;
  contentType: string;
  ext: string;
  width: number;
  height: number;
}

export async function optimizeImage(input: Buffer, type: string): Promise<OptimizedImage> {
  if (type === "image/gif") {
    const { width = 0, height = 0 } = await sharp(input).metadata();
    return { data: input, contentType: type, ext: "gif", width, height };
  }

  const { hasAlpha } = await sharp(input).metadata();
  const pipeline = sharp(input, { failOn: "none" })
    .rotate()
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true });

  const { data, info } = await (hasAlpha
    ? pipeline.webp({ lossless: true, effort: 5 })
    : pipeline.webp({ quality: 82, effort: 5, smartSubsample: true })
  ).toBuffer({ resolveWithObject: true });

  // Never store something heavier than what was sent (already well-compressed WebP, for example).
  if (type === "image/webp" && data.length >= input.length) {
    const meta = await sharp(input).metadata();
    return { data: input, contentType: type, ext: "webp", width: meta.width ?? info.width, height: meta.height ?? info.height };
  }

  return { data, contentType: "image/webp", ext: "webp", width: info.width, height: info.height };
}
