"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { logout, save } from "@/app/admin/actions";
import { PhotoGrid, getAt, uploadImage } from "@/app/admin/fields";
import { applyChanges, fetchLatestContent } from "@/lib/content-merge";
import { cn } from "@/lib/utils";
import type { SiteContent } from "@/types/content";

/*
 * In-page editor, loaded only for a logged-in admin (see EditModeLoader).
 * It finds the markers from lib/editable.ts and makes them editable:
 * texts become contentEditable, images get a "Trocar foto" button, links a small popover.
 * Changes are kept as { path: value } and saved together, then the page reloads.
 */

type Draft = Record<string, unknown>;
type Photo = string | { src: string; width: number; height: number };
type Hover = { el: HTMLElement; kind: "image" | "photos"; path: string; label: string };

const HINT_COOKIE = "berlim_edit";

const textMode = () => {
  const probe = document.createElement("div");
  probe.contentEditable = "plaintext-only";
  return probe.contentEditable === "plaintext-only" ? "plaintext-only" : "true";
};

const sameMarker = (attr: string, path: string) => document.querySelectorAll<HTMLElement>(`[${attr}="${CSS.escape(path)}"]`);

export default function EditMode() {
  const [base, setBase] = useState<SiteContent | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [enabled, setEnabled] = useState(true);
  const [hover, setHover] = useState<Hover | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const [link, setLink] = useState<{ el: HTMLElement; path?: string; hide?: HTMLElement; rect: DOMRect } | null>(null);
  const [photos, setPhotos] = useState<{ path: string; label: string } | null>(null);
  const [pick, setPick] = useState<{ path: string; text: string; rect: DOMRect; done?: "add" | "remove" } | null>(null);
  const [busy, setBusy] = useState<"" | "upload" | "save">("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<Hover | null>(null);

  const count = Object.keys(draft).length;
  const current = useCallback((path: string) => (path in draft ? draft[path] : getAt(base, path)), [draft, base]);

  /* Load the latest content; drop the hint cookie if the session is gone. */
  useEffect(() => {
    fetch("/admin/content", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) {
          document.cookie = `${HINT_COOKIE}=; Max-Age=0; path=/`;
          return;
        }
        if (res.ok) setBase((await res.json()) as SiteContent);
      })
      .catch(() => setError("Não foi possível carregar o conteúdo."));
  }, []);

  /* Turn markers into editable elements while edit mode is on. */
  useEffect(() => {
    if (!base || !enabled) return;
    const root = document.documentElement;
    root.dataset.editing = "";
    const mode = textMode();

    const prepare = () =>
      document.querySelectorAll<HTMLElement>("[data-edit]").forEach((el) => {
        if (el.contentEditable !== mode) {
          el.contentEditable = mode;
          el.spellcheck = false;
        }
      });
    prepare();
    const observer = new MutationObserver(prepare);
    observer.observe(document.body, { childList: true, subtree: true });

    const inUi = (t: EventTarget | null) => t instanceof Element && t.closest("[data-edit-ui]");

    const onInput = (e: Event) => {
      const el = (e.target as Element).closest<HTMLElement>("[data-edit]");
      if (!el) return;
      const path = el.dataset.edit!;
      const text = el.innerText.replace(/\n+$/, "");
      setDraft((d) => ({ ...d, [path]: text }));
      sameMarker("data-edit", path).forEach((other) => other !== el && (other.textContent = text));
    };
    // Safety net: when leaving an edited text, make sure its final value is in the draft.
    const onFocusOut = (e: FocusEvent) => {
      const el = (e.target as Element).closest?.<HTMLElement>("[data-edit]");
      if (!el) return;
      const path = el.dataset.edit!;
      const text = el.innerText.replace(/\n+$/, "");
      setDraft((d) => {
        const saved = path in d ? d[path] : getAt(base, path);
        return saved === text ? d : { ...d, [path]: text };
      });
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const el = (e.target as Element).closest?.<HTMLElement>("[data-edit]");
      if (el && e.key === "Enter") {
        e.preventDefault();
        el.blur();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (inUi(e.target)) return;
      const target = e.target as Element;
      // Links (and cards whose link overlay is disabled while editing) open a small popover instead of navigating.
      const anchor = target.closest("a") ?? (target.closest("[data-edit]") ? null : target.closest<HTMLElement>("[data-edit-nav]"));
      if (anchor) {
        e.preventDefault();
        setLink({
          el: anchor,
          path: anchor.dataset.editLink,
          hide: anchor.closest<HTMLElement>("[data-edit-hide]") ?? undefined,
          rect: anchor.getBoundingClientRect(),
        });
        return;
      }
      setLink(null);
      if (target.closest("[data-edit]") || target.closest('button[type="submit"]')) e.preventDefault();
    };
    const onSubmit = (e: Event) => e.preventDefault();
    const onOver = (e: MouseEvent) => {
      if (inUi(e.target)) return;
      const el = (e.target as Element).closest<HTMLElement>("[data-edit-image],[data-edit-photos]");
      if (!el) return setHover(null);
      const photosPath = el.dataset.editPhotos;
      setHover(
        photosPath
          ? { el, kind: "photos", path: photosPath, label: el.dataset.editLabel ?? "Editar fotos" }
          : { el, kind: "image", path: el.dataset.editImage!, label: "Trocar foto" },
      );
    };

    // Inside a [data-edit-highlight] text: selecting words offers "Sublinhar"; a click offers "Remover sublinhado".
    const onSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return setPick((p) => (p?.done ? p : null));
      const host = (node: Node | null) => (node instanceof Element ? node : node?.parentElement)?.closest<HTMLElement>("[data-edit-highlight]");
      const el = host(sel.anchorNode);
      if (!el || el !== host(sel.focusNode)) return setPick((p) => (p?.done ? p : null));
      const text = sel.isCollapsed ? "" : sel.toString().trim();
      const range = sel.getRangeAt(0).getBoundingClientRect();
      const rect = range.width || range.height ? range : el.getBoundingClientRect();
      setPick({ path: el.dataset.editHighlight!, text, rect });
    };

    document.addEventListener("selectionchange", onSelection);
    document.addEventListener("input", onInput);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("mouseover", onOver);
    return () => {
      observer.disconnect();
      delete root.dataset.editing;
      document.querySelectorAll<HTMLElement>("[data-edit]").forEach((el) => el.removeAttribute("contenteditable"));
      document.removeEventListener("selectionchange", onSelection);
      document.removeEventListener("input", onInput);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("mouseover", onOver);
      setHover(null);
      setLink(null);
    };
  }, [base, enabled]);

  /* Keep the floating image button glued to the hovered image. */
  useEffect(() => {
    if (!hover) return setHoverRect(null);
    const update = () => setHoverRect(hover.el.getBoundingClientRect());
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [hover]);

  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (Object.keys(draft).length) e.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [draft]);

  const replaceImage = async (file: File | undefined) => {
    const target = uploadTarget.current;
    if (!file || !target) return;
    setBusy("upload");
    setError("");
    try {
      const { url, width, height } = await uploadImage(file);
      setDraft((d) => {
        const next: Draft = { ...d, [target.path]: url };
        // Images that store their size (About blocks) get the new width/height too.
        const parentPath = target.path.split(".").slice(0, -1).join(".");
        const parent = getAt(base, parentPath) as Record<string, unknown> | undefined;
        if (parent && typeof parent.width === "number") {
          next[`${parentPath}.width`] = width;
          next[`${parentPath}.height`] = height;
        }
        return next;
      });
      sameMarker("data-edit-image", target.path).forEach((el) =>
        el.querySelectorAll("img").forEach((img) => {
          img.removeAttribute("srcset");
          img.src = url;
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao enviar a foto.");
    } finally {
      setBusy("");
    }
  };

  const onSave = async () => {
    if (!base || !count) return;
    setBusy("save");
    setError("");
    // Start from the latest saved version (it may have changed in /admin meanwhile) and apply only this page's edits.
    let next: SiteContent;
    try {
      next = applyChanges(await fetchLatestContent<SiteContent>(), draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
      setBusy("");
      return;
    }
    const result = await save(next);
    if (result.ok) {
      setDraft({});
      window.location.reload();
    } else {
      setError(result.error);
      setBusy("");
    }
  };

  const discard = () => {
    if (window.confirm("Descartar as alterações?")) {
      setDraft({});
      window.location.reload();
    }
  };

  if (!base) return null;

  return (
    <div data-edit-ui className="font-sans text-neutral-900">
      {/* Floating image / photos button */}
      {enabled && hover && hoverRect && hoverRect.width > 40 && (
        <button
          type="button"
          onClick={() => {
            if (hover.kind === "photos") setPhotos({ path: hover.path, label: hover.label });
            else {
              uploadTarget.current = hover;
              fileRef.current?.click();
            }
          }}
          style={{
            top: Math.max(hoverRect.top + 12, 12),
            left: Math.min(hoverRect.right - 12, window.innerWidth - 12),
          }}
          className="fixed z-[2000] flex -translate-x-full cursor-pointer items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold shadow-lg ring-1 ring-black/10 transition-transform hover:scale-105"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="2.5" />
            <circle cx="9" cy="9.5" r="1.8" />
            <path d="m21 16-5-5-9 9" />
          </svg>
          {busy === "upload" && uploadTarget.current?.path === hover.path ? "Enviando…" : hover.label}
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          replaceImage(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {/* "Sublinhar" / "Remover sublinhado" above the selection in a highlightable text */}
      {enabled && pick && (Boolean(pick.done) || Boolean(pick.text) || Boolean(current(pick.path))) && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          style={{ top: Math.max(pick.rect.top - 46, 8), left: pick.rect.left + pick.rect.width / 2 }}
          className="fixed z-[2050] flex max-w-[360px] -translate-x-1/2 items-center gap-1 rounded-full bg-neutral-900 p-1 text-[13px] font-semibold text-white shadow-xl"
        >
          {pick.done ? (
            <span className="px-3 py-1">{pick.done === "add" ? "✓ Será sublinhado ao salvar" : "✓ Sublinhado removido ao salvar"}</span>
          ) : (
            <>
              {pick.text && (
                <button
                  type="button"
                  onClick={() => {
                    setDraft((d) => ({ ...d, [pick.path]: pick.text }));
                    setPick({ ...pick, done: "add" });
                    window.setTimeout(() => setPick(null), 2200);
                  }}
                  className="flex min-w-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 hover:bg-white/10"
                >
                  <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 4v6a6 6 0 0 0 12 0V4M4 20c5-1.5 11-1.5 16 0" />
                  </svg>
                  <span className="truncate">Sublinhar “{pick.text}”</span>
                </button>
              )}
              {Boolean(current(pick.path)) && (
                <button
                  type="button"
                  onClick={() => {
                    setDraft((d) => ({ ...d, [pick.path]: "" }));
                    // Preview: hide the strokes right away (they are the non-editable parts of the text).
                    sameMarker("data-edit-highlight", pick.path).forEach((el) =>
                      el.querySelectorAll<HTMLElement>('[contenteditable="false"]').forEach((s) => (s.style.display = "none")),
                    );
                    setPick({ ...pick, done: "remove" });
                    window.setTimeout(() => setPick(null), 2200);
                  }}
                  className="cursor-pointer rounded-full px-3 py-1 whitespace-nowrap text-white/80 hover:bg-white/10 hover:text-white"
                >
                  {pick.text ? "Remover" : "Remover sublinhado"}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Link popover */}
      {enabled && link && (
        <LinkPopover
          rect={link.rect}
          href={link.path ? String(current(link.path) ?? "") : (link.el.getAttribute("href") ?? link.el.dataset.editNav ?? "")}
          editable={Boolean(link.path)}
          onChange={(href) => link.path && setDraft((d) => ({ ...d, [link.path!]: href }))}
          hidden={link.hide ? Boolean(current(`${link.hide.dataset.editHide}.hidden`)) : undefined}
          onHiddenChange={(hidden) => {
            if (!link.hide) return;
            const path = `${link.hide.dataset.editHide}.hidden`;
            link.hide.hidden = hidden;
            setDraft((d) => {
              const next = { ...d };
              if (hidden === Boolean(getAt(base, path))) delete next[path];
              else next[path] = hidden;
              return next;
            });
          }}
          onOpen={(href) => {
            if (count && !window.confirm("Você tem alterações não salvas. Sair desta página mesmo assim?")) return;
            setDraft({});
            window.location.href = href;
          }}
          onClose={() => setLink(null)}
        />
      )}

      {/* Slides / gallery editor */}
      {photos && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/40 p-4" onClick={() => setPhotos(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={photos.label}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl tab:p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-xl font-semibold">{photos.label}</h2>
              <button type="button" onClick={() => setPhotos(null)} className="cursor-pointer rounded-lg px-3 py-1.5 text-[13px] font-semibold hover:bg-neutral-100">
                Pronto
              </button>
            </div>
            <PhotoGrid
              value={(current(photos.path) as Photo[]) ?? []}
              objects={!photos.path.startsWith("home.slides")}
              onChange={(v) => setDraft((d) => ({ ...d, [photos.path]: v }))}
            />
            <p className="mt-3 text-xs text-neutral-400">Use as setas para mudar a ordem. As mudanças aparecem no site depois de salvar.</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="fixed bottom-4 left-1/2 z-[2000] flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-1 rounded-full bg-neutral-900 p-1.5 pl-2 text-white shadow-2xl">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className="flex cursor-pointer items-center gap-2 rounded-full px-2.5 py-1.5 text-[13px] font-medium hover:bg-white/10"
        >
          <span className={cn("relative h-4 w-7 rounded-full transition-colors", enabled ? "bg-emerald-400" : "bg-white/25")}>
            <span className={cn("absolute top-0.5 size-3 rounded-full bg-white transition-all", enabled ? "left-3.5" : "left-0.5")} />
          </span>
          Editar
        </button>
        <span className="hidden px-2 text-[13px] whitespace-nowrap text-white/60 tab:inline">
          {error ? <span className="text-red-300">{error}</span> : count ? `${count} ${count === 1 ? "alteração" : "alterações"}` : "Clique num texto, foto ou botão"}
        </span>
        {count > 0 && (
          <button type="button" onClick={discard} className="cursor-pointer rounded-full px-3 py-1.5 text-[13px] text-white/70 hover:bg-white/10 hover:text-white">
            Descartar
          </button>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={!count || busy === "save"}
          className="cursor-pointer rounded-full bg-white px-4 py-1.5 text-[13px] font-semibold text-neutral-900 transition-opacity disabled:cursor-default disabled:opacity-40"
        >
          {busy === "save" ? "Salvando…" : "Salvar"}
        </button>
        <a
          href="/admin"
          onClick={(e) => {
            if (count && !window.confirm("Sair sem salvar as alterações?")) e.preventDefault();
            else setDraft({});
          }}
          className="rounded-full px-3 py-1.5 text-[13px] whitespace-nowrap text-white/70 hover:bg-white/10 hover:text-white"
        >
          Editor completo
        </a>
        <button
          type="button"
          onClick={async () => {
            if (count && !window.confirm("Sair sem salvar as alterações?")) return;
            setDraft({});
            await logout();
            window.location.reload();
          }}
          className="cursor-pointer rounded-full px-3 py-1.5 text-[13px] whitespace-nowrap text-white/70 hover:bg-white/10 hover:text-white"
        >
          Sair
        </button>
      </div>
    </div>
  );
}

function LinkPopover({
  rect,
  href,
  editable,
  hidden,
  onChange,
  onHiddenChange,
  onOpen,
  onClose,
}: {
  rect: DOMRect;
  href: string;
  editable: boolean;
  /** Set when the button can be hidden (editHide). */
  hidden?: boolean;
  onChange: (href: string) => void;
  onHiddenChange: (hidden: boolean) => void;
  onOpen: (href: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && onClose();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const timer = window.setTimeout(() => document.addEventListener("pointerdown", close), 0);
    document.addEventListener("keydown", esc);
    window.addEventListener("scroll", onClose, { once: true });
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", onClose);
    };
  }, [onClose]);

  const below = rect.bottom + 8 + 60 < window.innerHeight;
  const width = hidden === undefined ? 320 : 400;
  const left = Math.min(Math.max(rect.left, 12), window.innerWidth - width - 12);

  return (
    <div
      ref={ref}
      style={{ left, width, top: below ? rect.bottom + 8 : rect.top - 8 }}
      className={cn(
        "fixed z-[2050] flex items-center gap-1.5 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-black/10",
        !below && "-translate-y-full",
      )}
    >
      <svg viewBox="0 0 24 24" className="ml-1.5 size-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
      </svg>
      {editable ? (
        <input
          autoFocus
          defaultValue={href}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onClose()}
          aria-label="Link"
          className="min-w-0 flex-1 rounded-md px-1.5 py-1 font-mono text-[12px] outline-none focus:bg-neutral-50"
        />
      ) : (
        <span className="min-w-0 flex-1 truncate px-1.5 font-mono text-[12px] text-neutral-500">{href}</span>
      )}
      <button
        type="button"
        onClick={() => onOpen(href)}
        className="cursor-pointer rounded-lg bg-neutral-900 px-2.5 py-1.5 text-[12px] font-semibold whitespace-nowrap text-white"
      >
        Abrir ↗
      </button>
      {hidden !== undefined && (
        <button
          type="button"
          onClick={() => onHiddenChange(!hidden)}
          className="cursor-pointer rounded-lg px-2.5 py-1.5 text-[12px] font-semibold whitespace-nowrap text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50"
        >
          {hidden ? "Mostrar" : "Ocultar"}
        </button>
      )}
    </div>
  );
}
