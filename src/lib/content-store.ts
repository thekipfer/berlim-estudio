import { promises as fs } from "node:fs";
import path from "node:path";
import { get, put } from "@vercel/blob";
import { cache } from "react";
import { defaultContent } from "@/lib/content";
import type { SiteContent } from "@/types/content";

/*
 * Where edited content lives:
 * - Vercel Blob when a store is connected (BLOB_READ_WRITE_TOKEN or BLOB_STORE_ID is set).
 * - Otherwise local files: content/site.json and public/uploads/ (for local development).
 * Server-only: never import this from a client component.
 */

const CONTENT_PATH = "site/content.json";
const LOCAL_CONTENT_FILE = path.join(process.cwd(), "content", "site.json");
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export const usesBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

type Json = Record<string, unknown>;

const isObject = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Objects merge key by key; arrays and plain values from `stored` replace the defaults.
 * Keys missing from the defaults are dropped, so every new field needs a default in lib/content.ts.
 */
function mergeContent<T>(defaults: T, stored: unknown): T {
  if (!isObject(defaults) || !isObject(stored)) return (stored ?? defaults) as T;
  const out: Json = { ...defaults };
  for (const [key, value] of Object.entries(stored)) {
    if (!(key in defaults)) continue;
    const base = (defaults as Json)[key];
    if (Array.isArray(base)) out[key] = Array.isArray(value) ? value : base;
    else if (isObject(base)) out[key] = mergeContent(base, value);
    else if (typeof value === typeof base) out[key] = value;
  }
  return out as T;
}

async function readLocal(): Promise<unknown> {
  try {
    return JSON.parse(await fs.readFile(LOCAL_CONTENT_FILE, "utf8"));
  } catch {
    return null;
  }
}

async function readStored(): Promise<unknown> {
  if (usesBlob()) {
    try {
      const result = await get(CONTENT_PATH, { access: "public", useCache: false });
      if (result?.statusCode === 200) return JSON.parse(await new Response(result.stream).text());
    } catch {
      // fall through to the committed file
    }
    // Blob just connected and still empty: keep serving the content committed in content/site.json
    // (the first save from the editor then writes it to Blob).
  }
  return readLocal(); // null when nothing saved yet: use the defaults
}

/** Site content = defaults + saved edits. Cached per request. */
export const getContent = cache(async (): Promise<SiteContent> => {
  const stored = await readStored();
  const content = stored ? mergeContent(defaultContent, stored) : defaultContent;
  // Older saves kept the "All" tab inside the filters: move its text to allLabel.
  const allTab = content.works.filters.find((f) => f.value === "all");
  const works = allTab
    ? { ...content.works, allLabel: allTab.label, filters: content.works.filters.filter((f) => f !== allTab) }
    : content.works;
  // Each project has its own page content; projects saved before that start with the shared one.
  const { gallery, intro, meta } = content.projectPage;
  return {
    ...content,
    works,
    projects: content.projects.map((p) => ({
      ...p,
      gallery: p.gallery ?? gallery,
      intro: p.intro ?? intro,
      meta: Array.isArray(p.meta) ? p.meta : meta,
    })),
  };
});

export async function saveContent(content: SiteContent) {
  const json = JSON.stringify(content, null, 2);
  if (usesBlob()) {
    await put(CONTENT_PATH, json, {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
      addRandomSuffix: false,
      cacheControlMaxAge: 60,
    });
    return;
  }
  await fs.mkdir(path.dirname(LOCAL_CONTENT_FILE), { recursive: true });
  await fs.writeFile(LOCAL_CONTENT_FILE, json);
}

/** Stores an (already optimized) image and returns its public URL. */
export async function saveUpload(data: Buffer, ext: string, contentType: string): Promise<string> {
  const base = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  if (usesBlob()) {
    const blob = await put(`uploads/${base}`, data, { access: "public", contentType });
    return blob.url;
  }
  await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_UPLOAD_DIR, base), data);
  return `/uploads/${base}`;
}
