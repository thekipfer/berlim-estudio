"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { getIcon, iconNames, iconRegistry } from "@/components/icon-registry";
import { cn } from "@/lib/utils";
import type { SiteContent } from "@/types/content";
import type { FieldDef } from "./schema";

/* ---------- path helpers ---------- */

type Obj = Record<string, unknown>;

export function getAt(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((cur, key) => (cur as Obj | undefined)?.[key], obj);
}

/** Immutable set by dot path; numeric segments index into arrays ("home.slides.2"). */
export function setAt<T>(obj: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split(".");
  const child = (cur: unknown) => (rest.length ? setAt(cur, rest.join("."), value) : value);
  if (Array.isArray(obj)) {
    const next = [...obj];
    next[Number(head)] = child(next[Number(head)]);
    return next as T;
  }
  const base = (obj ?? {}) as Obj;
  return { ...base, [head]: child(base[head]) } as T;
}

/* ---------- image upload ---------- */
/*
 * The server compresses every upload to WebP (lib/optimize-image.ts). The browser only steps in
 * when it must: photos too big for the 4 MB upload limit, or formats the server can't read (HEIC).
 * In that case it re-encodes at high quality so the server's WebP pass has a clean source.
 */

const SEND_LIMIT = 3.5 * 1024 * 1024;
const MAX_SIDE = 3000;
const SERVER_READS = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

async function prepare(file: File): Promise<File> {
  if (file.type === "image/gif" || (SERVER_READS.includes(file.type) && file.size <= SEND_LIMIT)) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  // Transparent PNGs stay PNG (lossless); everything else becomes a high-quality JPEG.
  const type = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("resize failed"))), type, 0.92),
  );
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + (type === "image/png" ? ".png" : ".jpg"), { type });
}

export interface UploadResult {
  url: string;
  width: number;
  height: number;
  /** Size of the file the user picked and of the stored WebP, in bytes. */
  originalBytes: number;
  bytes: number;
}

export async function uploadImage(file: File): Promise<UploadResult> {
  const body = new FormData();
  body.append("file", await prepare(file));
  body.append("originalBytes", String(file.size));
  const res = await fetch("/admin/upload", { method: "POST", body });
  const data = (await res.json()) as Partial<UploadResult> & { error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Falha ao enviar a imagem.");
  return {
    url: data.url,
    width: data.width ?? 0,
    height: data.height ?? 0,
    originalBytes: data.originalBytes ?? file.size,
    bytes: data.bytes ?? 0,
  };
}

const formatBytes = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** "Otimizada em WebP: 3.2 MB → 410 KB (−87%)" */
export function savingsText(r: UploadResult) {
  if (!r.bytes) return "";
  const saved = Math.round((1 - r.bytes / r.originalBytes) * 100);
  return `Otimizada em WebP: ${formatBytes(r.originalBytes)} → ${formatBytes(r.bytes)}${saved > 0 ? ` (−${saved}%)` : ""}`;
}

/* ---------- small building blocks ---------- */

const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[15px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900";

function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <div className="text-[13px] font-medium text-neutral-700">{children}</div>
      {hint && <div className="text-xs text-neutral-400">{hint}</div>}
    </div>
  );
}

function IconButton({ label, onClick, children, disabled }: { label: string; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-7 cursor-pointer items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

const Up = () => <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 15 6-6 6 6" /></svg>;
const Down = () => <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 9 6 6 6-6" /></svg>;
const Trash = () => <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" /></svg>;
const Swap = () => <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5" /></svg>;
const Plus = () => <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14" /></svg>;

function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-[13px] font-medium text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900"
    >
      <Plus />
      {children}
    </button>
  );
}

/* ---------- image ---------- */

function useUpload(onDone: (r: UploadResult) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    setNote("");
    try {
      const result = await uploadImage(file);
      onDone(result);
      setNote(savingsText(result));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao enviar.");
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, note, pick };
}

function ImageField({
  value,
  dark,
  onChange,
}: {
  value: string;
  dark?: boolean;
  onChange: (url: string, dims?: { width: number; height: number }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { busy, error, note, pick } = useUpload((r) => onChange(r.url, { width: r.width, height: r.height }));
  const [dragging, setDragging] = useState(false);

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex items-center gap-3 rounded-lg border bg-white p-2 transition-colors",
          dragging ? "border-neutral-900 bg-neutral-50" : "border-neutral-200",
        )}
      >
        <div
          className={cn(
            "flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[length:12px_12px]",
            dark
              ? "bg-[repeating-conic-gradient(#1a1a1a_0_25%,#2a2a2a_0_50%)]"
              : "bg-[repeating-conic-gradient(#f2f2f2_0_25%,#fff_0_50%)]",
          )}
        >
          {value ? (
            <img src={value} alt="" className="size-full object-contain" />
          ) : (
            <span className="text-xs text-neutral-400">sem foto</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer rounded-md bg-neutral-900 px-3 py-1.5 text-[13px] font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {busy ? "Enviando…" : value ? "Trocar foto" : "Enviar foto"}
          </button>
          <div className="mt-1 truncate text-xs text-neutral-400" title={value}>
            {error ? (
              <span className="text-red-600">{error}</span>
            ) : note ? (
              <span className="text-emerald-600">{note}</span>
            ) : (
              "ou arraste uma imagem aqui"
            )}
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ---------- photo grid (slides, gallery) ---------- */

type Photo = string | { src: string; width: number; height: number };
const photoSrc = (p: Photo) => (typeof p === "string" ? p : p.src);

export function PhotoGrid({ value, objects, onChange }: { value: Photo[]; objects?: boolean; onChange: (v: Photo[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceIndex = useRef(-1);
  const [busy, setBusy] = useState(0);
  const [replacing, setReplacing] = useState(-1);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  /** Upload a new file in place of photo `index`, keeping its position. */
  const replaceFile = async (index: number, file: File | undefined) => {
    if (!file || index < 0) return;
    setError("");
    setNote("");
    setReplacing(index);
    try {
      const r = await uploadImage(file);
      setNote(savingsText(r));
      const photo: Photo = objects ? { src: r.url, width: r.width, height: r.height } : r.url;
      onChange(value.map((p, j) => (j === index ? photo : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao enviar.");
    }
    setReplacing(-1);
  };

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    setNote("");
    setBusy(files.length);
    const added: Photo[] = [];
    const total = { url: "", width: 0, height: 0, originalBytes: 0, bytes: 0 };
    for (const file of Array.from(files)) {
      try {
        const r = await uploadImage(file);
        total.originalBytes += r.originalBytes;
        total.bytes += r.bytes;
        added.push(objects ? { src: r.url, width: r.width, height: r.height } : r.url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao enviar.");
      }
      setBusy((n) => n - 1);
    }
    onChange([...value, ...added]);
    if (added.length) setNote(`${added.length > 1 ? `${added.length} fotos. ` : ""}${savingsText(total)}`);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 tab:grid-cols-3 desk:grid-cols-4">
        {value.map((photo, i) => (
          <div key={`${i}-${photoSrc(photo)}`} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
            <img src={photoSrc(photo)} alt="" className={cn("size-full object-cover", replacing === i && "opacity-40")} />
            {replacing === i && (
              <span className="absolute inset-0 flex items-center justify-center text-[12px] font-medium text-neutral-800">Enviando…</span>
            )}
            <span className="absolute top-1.5 left-1.5 rounded bg-black/60 px-1.5 text-[11px] leading-5 font-medium text-white">{i + 1}</span>
            <div className="absolute right-1.5 bottom-1.5 flex gap-0.5 rounded-md bg-white/95 p-0.5 opacity-100 shadow-sm transition-opacity tab:opacity-0 tab:group-hover:opacity-100 tab:group-focus-within:opacity-100">
              <IconButton label="Mover para antes" disabled={i === 0} onClick={() => onChange(move(value, i, i - 1))}>
                <span className="-rotate-90"><Up /></span>
              </IconButton>
              <IconButton label="Mover para depois" disabled={i === value.length - 1} onClick={() => onChange(move(value, i, i + 1))}>
                <span className="-rotate-90"><Down /></span>
              </IconButton>
              <IconButton
                label="Trocar foto"
                onClick={() => {
                  replaceIndex.current = i;
                  replaceRef.current?.click();
                }}
              >
                <Swap />
              </IconButton>
              <IconButton label="Remover foto" onClick={() => onChange(value.filter((_, j) => j !== i))}>
                <Trash />
              </IconButton>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
          className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-300 text-[13px] font-medium text-neutral-500 transition-colors hover:border-neutral-900 hover:text-neutral-900"
        >
          <Plus />
          {busy > 0 ? `Enviando ${busy}…` : "Adicionar fotos"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {!error && note && <p className="mt-2 text-xs text-emerald-600">{note}</p>}
      <input
        ref={replaceRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          replaceFile(replaceIndex.current, e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ---------- icon picker ---------- */

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const Icon = getIcon(value);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-[38px] cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-[14px] text-neutral-800 transition-colors hover:border-neutral-400"
      >
        <Icon className="size-[18px]" />
        <span>{iconRegistry[value]?.label ?? "Escolher"}</span>
      </button>
      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-30 grid w-[264px] grid-cols-6 gap-1 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
          {iconNames.map((name) => {
            const { Icon: Option, label } = iconRegistry[name];
            return (
              <button
                key={name}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                className={cn(
                  "flex size-10 cursor-pointer items-center justify-center rounded-lg transition-colors",
                  name === value ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100",
                )}
              >
                <Option className="size-5" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- lists ---------- */

function StringList({ value, onChange, addLabel }: { value: string[]; onChange: (v: string[]) => void; addLabel: string }) {
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex items-center gap-1">
          <input value={item} onChange={(e) => onChange(value.map((v, j) => (j === i ? e.target.value : v)))} className={inputClass} />
          <IconButton label="Subir" disabled={i === 0} onClick={() => onChange(move(value, i, i - 1))}><Up /></IconButton>
          <IconButton label="Descer" disabled={i === value.length - 1} onClick={() => onChange(move(value, i, i + 1))}><Down /></IconButton>
          <IconButton label="Remover" onClick={() => onChange(value.filter((_, j) => j !== i))}><Trash /></IconButton>
        </div>
      ))}
      <AddButton onClick={() => onChange([...value, ""])}>{addLabel}</AddButton>
    </div>
  );
}

function ListField({ def, value, onChange, root }: { def: Extract<FieldDef, { kind: "list" }>; value: Obj[]; onChange: (v: Obj[]) => void; root: SiteContent }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {value.map((item, i) => {
        const isOpen = open === i;
        const firstIcon = def.fields.find((f) => f.kind === "icon");
        const ItemIcon = firstIcon ? getIcon(String(item[firstIcon.key] ?? "")) : null;
        return (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white">
            <div className="flex items-center gap-1 py-1 pr-1.5 pl-3">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-1.5 text-left text-[14px] font-medium text-neutral-800"
              >
                <span className={cn("text-neutral-400 transition-transform", isOpen && "rotate-180")}><Down /></span>
                {ItemIcon && <ItemIcon className="size-4 shrink-0" />}
                <span className="truncate">{def.itemTitle(item, i)}</span>
              </button>
              <IconButton label="Subir" disabled={i === 0} onClick={() => { onChange(move(value, i, i - 1)); setOpen(null); }}><Up /></IconButton>
              <IconButton label="Descer" disabled={i === value.length - 1} onClick={() => { onChange(move(value, i, i + 1)); setOpen(null); }}><Down /></IconButton>
              <IconButton
                label="Remover"
                onClick={() => {
                  if (window.confirm(`Remover “${def.itemTitle(item, i)}”?`)) {
                    onChange(value.filter((_, j) => j !== i));
                    setOpen(null);
                  }
                }}
              >
                <Trash />
              </IconButton>
            </div>
            {isOpen && (
              <div className="space-y-4 border-t border-neutral-100 p-3">
                {def.fields.map((f) => (
                  <Field key={f.key} def={f} obj={item} onObjChange={(next) => onChange(value.map((v, j) => (j === i ? next : v)))} root={root} />
                ))}
              </div>
            )}
          </div>
        );
      })}
      <AddButton
        onClick={() => {
          onChange([...value, def.newItem()]);
          setOpen(value.length);
        }}
      >
        {def.addLabel}
      </AddButton>
    </div>
  );
}

function Checks({ value, options, onChange }: { value: string[]; options: { value: string; label: string }[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1 text-[13px] transition-colors",
              on ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400",
            )}
          >
            {on && <span className="mr-1 opacity-60">{value.indexOf(o.value) + 1}</span>}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- field dispatcher ---------- */

/** Renders one field of `obj` (a section root or a list item) and reports the updated object. */
export function Field({ def, obj, onObjChange, root }: { def: FieldDef; obj: unknown; onObjChange: (next: Obj) => void; root: SiteContent }) {
  const value = getAt(obj, def.key);
  const set = (v: unknown) => onObjChange(setAt(obj as Obj, def.key, v));

  switch (def.kind) {
    case "text":
    case "link":
      return (
        <label className="block">
          <Label hint={def.hint}>{def.label}</Label>
          <input
            value={String(value ?? "")}
            onChange={(e) => set(e.target.value)}
            placeholder={def.kind === "link" ? "/pagina ou https://…" : undefined}
            className={cn(inputClass, def.kind === "link" && "font-mono text-[13px]")}
          />
        </label>
      );
    case "textarea":
      return (
        <label className="block">
          <Label hint={def.hint}>{def.label}</Label>
          <textarea value={String(value ?? "")} onChange={(e) => set(e.target.value)} rows={3} className={cn(inputClass, "resize-y leading-relaxed")} />
        </label>
      );
    case "image": {
      const parentPath = def.key.split(".").slice(0, -1).join(".");
      return (
        <div>
          <Label hint={def.hint}>{def.label}</Label>
          <ImageField
            value={String(value ?? "")}
            dark={def.dark}
            onChange={(url, dims) => {
              let next = setAt(obj as Obj, def.key, url);
              if (def.dims && dims) {
                next = setAt(next, parentPath ? `${parentPath}.width` : "width", dims.width);
                next = setAt(next, parentPath ? `${parentPath}.height` : "height", dims.height);
              }
              onObjChange(next);
            }}
          />
        </div>
      );
    }
    case "icon":
      return (
        <div>
          <Label>{def.label}</Label>
          <IconPicker value={String(value ?? "")} onChange={set} />
        </div>
      );
    case "toggle":
      return (
        <label className="flex cursor-pointer items-start gap-2 self-center py-2 text-[13px] text-neutral-700">
          <input
            type="checkbox"
            checked={typeof value === "boolean" ? value : Boolean(def.defaultValue)}
            onChange={(e) => set(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-neutral-900"
          />
          <span>
            {def.label}
            {def.hint && <span className="block text-xs text-neutral-400">{def.hint}</span>}
          </span>
        </label>
      );
    case "images":
      return (
        <div>
          <Label hint={def.hint}>{def.label}</Label>
          <PhotoGrid value={(value as Photo[]) ?? []} objects={def.objects} onChange={set} />
        </div>
      );
    case "strings":
      return (
        <div>
          <Label hint={def.hint}>{def.label}</Label>
          <StringList value={(value as string[]) ?? []} onChange={set} addLabel={def.addLabel} />
        </div>
      );
    case "checks":
      return (
        <div>
          <Label hint={def.hint}>{def.label}</Label>
          <Checks value={(value as string[]) ?? []} options={def.options(root)} onChange={set} />
        </div>
      );
    case "group":
      return (
        <fieldset className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3">
          <legend className="px-1 text-[13px] font-medium text-neutral-700">{def.label}</legend>
          <div className="flex flex-wrap items-end gap-3 [&>*]:min-w-[180px] [&>*]:flex-1">
            {def.fields.map((f) => (
              <Field key={f.key} def={f} obj={value} onObjChange={(next) => set(next)} root={root} />
            ))}
          </div>
        </fieldset>
      );
    case "list":
      return (
        <div>
          <Label hint={def.hint}>{def.label}</Label>
          <ListField def={def} value={(value as Obj[]) ?? []} onChange={set} root={root} />
        </div>
      );
  }
}
