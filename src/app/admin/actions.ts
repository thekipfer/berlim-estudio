"use server";

import { revalidatePath } from "next/cache";
import { checkCredentials, endSession, isLoggedIn, startSession } from "@/lib/auth";
import { getContent, saveContent, usesBlob } from "@/lib/content-store";
import { applyCategoryChanges } from "@/lib/categories";
import { applyPageSlugs, applyProjectSlugs } from "@/lib/site";
import type { SiteContent } from "@/types/content";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type SaveResult = { ok: true; content: SiteContent } | { ok: false; error: string };

export async function login(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (!checkCredentials(email, password)) {
    await new Promise((r) => setTimeout(r, 700)); // slow down guessing
    return { ok: false, error: "E-mail ou senha incorretos." };
  }
  await startSession();
  return { ok: true };
}

export async function logout() {
  await endSession();
}

export async function save(input: SiteContent): Promise<SaveResult> {
  if (!(await isLoggedIn())) return { ok: false, error: "Sua sessão expirou. Entre de novo." };
  if (typeof input !== "object" || input === null || !Array.isArray(input.projects)) {
    return { ok: false, error: "Conteúdo inválido." };
  }
  // A changed page address also updates every link that pointed to the old one.
  const previous = await getContent();
  // Renamed or deleted categories are also updated in the projects.
  const withPages = applyPageSlugs(previous, {
    ...input,
    pages: { ...previous.pages, ...input.pages },
    oldPages: { ...previous.oldPages, ...input.oldPages },
    works: { ...previous.works, ...input.works },
  });
  // Projects with "endereço automático" get an address that follows their title.
  const content = applyProjectSlugs(previous, applyCategoryChanges(previous, withPages));
  try {
    await saveContent(content);
  } catch (error) {
    console.error("[admin] save failed", error);
    const hint = usesBlob() ? "" : " Em produção, conecte um Vercel Blob ao projeto.";
    return { ok: false, error: `Não foi possível salvar.${hint}` };
  }
  revalidatePath("/", "layout");
  return { ok: true, content };
}
