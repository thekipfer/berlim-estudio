/*
 * Saving only what changed, so two editors (the /admin page and the in-page editor,
 * or two tabs) never overwrite each other's work with an old copy.
 */

type Obj = Record<string, unknown>;

const isObject = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

/** Changed values between two versions, as { "home.quote": "…" }. Lists count as one value. */
export function diffPaths(before: unknown, after: unknown, prefix = ""): Obj {
  if (JSON.stringify(before) === JSON.stringify(after)) return {};
  if (isObject(before) && isObject(after)) {
    const out: Obj = {};
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      Object.assign(out, diffPaths(before[key], after[key], prefix ? `${prefix}.${key}` : key));
    }
    return out;
  }
  return { [prefix]: after };
}

/** Immutable set by dot path; numeric segments index into arrays ("home.slides.2"). */
export function setPath<T>(obj: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split(".");
  const child = (cur: unknown) => (rest.length ? setPath(cur, rest.join("."), value) : value);
  if (Array.isArray(obj)) {
    const next = [...obj];
    next[Number(head)] = child(next[Number(head)]);
    return next as T;
  }
  const base = (obj ?? {}) as Obj;
  return { ...base, [head]: child(base[head]) } as T;
}

export function applyChanges<T>(target: T, changes: Obj): T {
  return Object.entries(changes).reduce((acc, [path, value]) => setPath(acc, path, value), target);
}

/** Latest saved content (admin session required). */
export async function fetchLatestContent<T>(): Promise<T> {
  const res = await fetch("/admin/content", { cache: "no-store" });
  if (!res.ok) throw new Error(res.status === 401 ? "Sua sessão expirou. Entre de novo." : "Não foi possível carregar o conteúdo.");
  return (await res.json()) as T;
}
