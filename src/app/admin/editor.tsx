"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { applyChanges, diffPaths, fetchLatestContent } from "@/lib/content-merge";
import { slugify } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { SiteContent } from "@/types/content";
import { logout, save } from "./actions";
import { Field } from "./fields";
import { getLeads } from "@/lib/lead-actions";
import { LeadsPanel } from "./leads-panel";
import { sectionGroups, sections } from "./schema";

/**
 * Fill empty/duplicate project slugs from titles. Links to renamed or removed projects
 * (home grid, "Other works") are left for the server, which knows the saved addresses.
 */
function normalize(content: SiteContent): SiteContent {
  const used = new Set<string>();
  const projects = content.projects.map((p) => {
    const base = slugify(p.slug || p.title) || "projeto";
    let slug = base;
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    used.add(slug);
    return { ...p, slug };
  });
  return { ...content, projects };
}

/** Pseudo-section id for the contact requests list. */
const LEADS = "__mensagens";

type Status = { kind: "idle" | "saved" | "error"; message?: string };

export function Editor({ initial, storage }: { initial: SiteContent; storage: "blob" | "local" }) {
  const router = useRouter();
  const [content, setContent] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [active, setActive] = useState(sections[0].id);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [saving, startSaving] = useTransition();

  const dirty = useMemo(() => JSON.stringify(content) !== JSON.stringify(saved), [content, saved]);
  const section = sections.find((s) => s.id === active) ?? sections[0];
  const showLeads = active === LEADS;
  const [projectIndex, setProjectIndex] = useState(0);
  const [leadCount, setLeadCount] = useState<number | null>(null);

  // Badge next to "Mensagens" in the sidebar.
  useEffect(() => {
    getLeads().then((r) => r.ok && setLeadCount(r.leads.length));
  }, []);

  const onSave = useCallback(() => {
    if (!dirty || saving) return;
    startSaving(async () => {
      // Apply only what changed here on top of the latest saved version,
      // so edits made meanwhile in the site's in-page editor (or another tab) are kept.
      let next: SiteContent;
      try {
        const changes = diffPaths(saved, content);
        next = normalize(applyChanges(await fetchLatestContent<SiteContent>(), changes));
      } catch (e) {
        setStatus({ kind: "error", message: e instanceof Error ? e.message : "Não foi possível salvar." });
        return;
      }
      const result = await save(next);
      if (result.ok) {
        // The server may adjust page addresses and the links that point to them.
        setContent(result.content);
        setSaved(result.content);
        setStatus({ kind: "saved", message: "Publicado" });
      } else {
        setStatus({ kind: "error", message: result.error });
      }
    });
  }, [content, saved, dirty, saving]);

  // Coming back to this tab with nothing pending: load the latest content (it may have been edited on the site).
  useEffect(() => {
    if (dirty) return;
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const latest = await fetchLatestContent<SiteContent>();
        if (JSON.stringify(latest) !== JSON.stringify(saved)) {
          setContent(latest);
          setSaved(latest);
        }
      } catch {
        // offline or session expired: keep what is on screen
      }
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [dirty, saved]);

  // Mark this browser as the admin's so the public pages load the in-page editor ("Ver site").
  useEffect(() => {
    document.cookie = `berlim_edit=1; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
  }, []);

  // Cmd/Ctrl+S saves; warn before leaving with unsaved changes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [onSave, dirty]);

  useEffect(() => {
    if (status.kind !== "saved") return;
    const t = window.setTimeout(() => setStatus({ kind: "idle" }), 2500);
    return () => window.clearTimeout(t);
  }, [status]);

  const statusText =
    status.kind === "error"
      ? status.message
      : saving
        ? "Salvando…"
        : status.kind === "saved"
          ? "✓ Publicado no site"
          : dirty
            ? "Alterações não salvas"
            : "Tudo salvo";

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4 desk:px-6">
          <span className="font-heading text-lg font-bold tracking-tight">BERLIM</span>
          <span className="hidden text-sm text-neutral-400 tab:inline">Editor</span>
          <div className="ml-auto flex items-center gap-2">
            <span
              role="status"
              className={cn(
                "hidden text-[13px] tab:inline",
                status.kind === "error" ? "text-red-600" : dirty ? "text-amber-600" : "text-neutral-400",
              )}
            >
              {statusText}
            </span>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              Ver site ↗
            </a>
            <button
              type="button"
              onClick={onSave}
              disabled={!dirty || saving}
              className="cursor-pointer rounded-lg bg-neutral-900 px-4 py-1.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-85 disabled:cursor-default disabled:opacity-30"
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={async () => {
                if (dirty && !window.confirm("Sair sem salvar as alterações?")) return;
                await logout();
                router.refresh();
              }}
              className="cursor-pointer rounded-lg px-2 py-1.5 text-[13px] text-neutral-500 transition-colors hover:text-neutral-900"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1200px] gap-8 px-4 py-6 desk:px-6">
        {/* Sidebar */}
        <nav aria-label="Seções" className="sticky top-20 hidden h-fit w-56 shrink-0 tab:block">
          <button
            type="button"
            onClick={() => setActive(LEADS)}
            aria-current={showLeads ? "page" : undefined}
            className={cn(
              "mb-5 flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-left text-[14px] transition-colors",
              showLeads ? "bg-neutral-900 font-medium text-white" : "text-neutral-600 hover:bg-neutral-200/60",
            )}
          >
            Mensagens
            {leadCount ? (
              <span className={cn("rounded-full px-1.5 text-[11px] font-semibold", showLeads ? "bg-white/20" : "bg-neutral-900 text-white")}>
                {leadCount}
              </span>
            ) : null}
          </button>
          {sectionGroups.map((group) => (
            <div key={group} className="mb-5">
              <div className="mb-1 px-2 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">{group}</div>
              {sections
                .filter((s) => s.group === group)
                .map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActive(s.id)}
                    aria-current={s.id === active ? "page" : undefined}
                    className={cn(
                      "block w-full cursor-pointer rounded-lg px-2 py-1.5 text-left text-[14px] transition-colors",
                      s.id === active ? "bg-neutral-900 font-medium text-white" : "text-neutral-600 hover:bg-neutral-200/60",
                    )}
                  >
                    {s.title}
                  </button>
                ))}
            </div>
          ))}
          {storage === "local" && (
            <p className="px-2 text-[11px] leading-relaxed text-neutral-400">
              Salvando localmente em <code>content/site.json</code>.
            </p>
          )}
        </nav>

        {/* Section */}
        <main className="min-w-0 flex-1 pb-24">
          {/* Mobile section picker */}
          <select
            value={active}
            onChange={(e) => setActive(e.target.value)}
            aria-label="Seção"
            className="mb-5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[15px] tab:hidden"
          >
            <option value={LEADS}>Mensagens</option>
            {sectionGroups.map((group) => (
              <optgroup key={group} label={group}>
                {sections
                  .filter((s) => s.group === group)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>

          {showLeads ? (
            <>
              <h1 className="font-heading text-2xl font-semibold">Mensagens</h1>
              <p className="mt-1 mb-6 text-sm text-neutral-500">Pedidos enviados pelo formulário “Vamos conversar” da home.</p>
              <LeadsPanel onCount={setLeadCount} />
            </>
          ) : (
            <>
              <h1 className="font-heading text-2xl font-semibold">{section.title}</h1>
              {section.description && <p className="mt-1 text-sm text-neutral-500">{section.description}</p>}

              {section.perProject && (
                <label className="mt-6 block">
                  <span className="mb-1.5 block text-[13px] font-medium text-neutral-700">Projeto</span>
                  <select
                    value={Math.max(0, Math.min(projectIndex, content.projects.length - 1))}
                    onChange={(e) => setProjectIndex(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-[15px] outline-none focus:border-neutral-900"
                  >
                    {content.projects.map((p, i) => (
                      <option key={i} value={i}>
                        {p.title || `Projeto ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div key={`${section.id}-${projectIndex}`} className="mt-6 space-y-6 rounded-2xl border border-neutral-200 bg-white p-4 tab:p-6">
                {section.fields.map((def) => {
                  const resolved = def.key.startsWith("$project.")
                    ? { ...def, key: def.key.replace("$project.", `projects.${Math.max(0, Math.min(projectIndex, content.projects.length - 1))}.`) }
                    : def;
                  return (
                    <Field key={resolved.key} def={resolved} obj={content} onObjChange={(next) => setContent(next as unknown as SiteContent)} root={content} />
                  );
                })}
              </div>
            </>
          )}

          {/* Mobile status */}
          <p
            className={cn(
              "mt-4 text-center text-[13px] tab:hidden",
              status.kind === "error" ? "text-red-600" : dirty ? "text-amber-600" : "text-neutral-400",
            )}
          >
            {statusText}
          </p>
        </main>
      </div>
    </div>
  );
}
