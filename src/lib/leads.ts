import { promises as fs } from "node:fs";
import path from "node:path";
import { del, list, put } from "@vercel/blob";
import { usesBlob } from "@/lib/content-store";

/*
 * Contact requests sent from the home booking form. Server-only.
 * One JSON file per request: Vercel Blob ("leads/…", unguessable URL) or content/leads/ locally
 * (git-ignored: it holds personal data).
 */

export interface Lead {
  id: string;
  createdAt: string;
  service: string;
  location: string;
  employee: string;
  name: string;
  email: string;
  phone: string;
  message: string;
}

const LOCAL_DIR = path.join(process.cwd(), "content", "leads");

export async function saveLead(lead: Omit<Lead, "id" | "createdAt">) {
  const createdAt = new Date().toISOString();
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const record: Lead = { id, createdAt, ...lead };
  const json = JSON.stringify(record, null, 2);
  if (usesBlob()) {
    await put(`leads/${id}.json`, json, { access: "public", contentType: "application/json", addRandomSuffix: true });
    return record;
  }
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_DIR, `${id}.json`), json);
  return record;
}

/** All requests, newest first. */
export async function listLeads(): Promise<(Lead & { key: string })[]> {
  const leads: (Lead & { key: string })[] = [];
  if (usesBlob()) {
    const { blobs } = await list({ prefix: "leads/", limit: 1000 });
    await Promise.all(
      blobs.map(async (b) => {
        try {
          const res = await fetch(b.url, { cache: "no-store" });
          leads.push({ ...((await res.json()) as Lead), key: b.url });
        } catch {
          // skip unreadable entries
        }
      }),
    );
  } else {
    const files = await fs.readdir(LOCAL_DIR).catch(() => []);
    for (const file of files.filter((f) => f.endsWith(".json"))) {
      try {
        leads.push({ ...(JSON.parse(await fs.readFile(path.join(LOCAL_DIR, file), "utf8")) as Lead), key: file });
      } catch {
        // skip unreadable entries
      }
    }
  }
  return leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** `key` is the blob URL or local file name returned by listLeads. */
export async function deleteLead(key: string) {
  if (usesBlob()) {
    if (!key.includes("/leads/")) throw new Error("invalid key");
    await del(key);
    return;
  }
  const file = path.basename(key);
  if (!file.endsWith(".json")) throw new Error("invalid key");
  await fs.unlink(path.join(LOCAL_DIR, file));
}
