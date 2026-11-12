import { slugify } from "@/lib/site";
import type { SiteContent } from "@/types/content";

/** Internal id for a new category (never shown; stays the same when the name changes). */
export const newCategoryValue = () => `cat-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/**
 * Applies category edits on save:
 * - every category gets a unique internal value ("all" is reserved for the show-everything tab);
 * - a renamed category also renames the card text of projects that used the old name;
 * - a deleted category is removed from every project.
 */
export function applyCategoryChanges(previous: SiteContent, next: SiteContent): SiteContent {
  // An editor opened before the "All" text had its own field still sends it as a filter.
  const allTab = next.works.filters.find((f) => f.value === "all");
  const allLabel = allTab ? allTab.label : next.works.allLabel;

  const used = new Set<string>(["all"]);
  const filters = next.works.filters
    .filter((f) => f.value !== "all" && f.label.trim())
    .map((f) => {
      let value = f.value && !used.has(f.value) ? f.value : slugify(f.label) || "categoria";
      for (let n = 2; used.has(value); n++) value = `${slugify(f.label) || "categoria"}-${n}`;
      used.add(value);
      return { label: f.label.trim(), value };
    });

  const oldLabels = new Map(previous.works.filters.map((f) => [f.value, f.label]));
  const renamed = new Map<string, string>(); // old name (lowercase) → new name
  for (const f of filters) {
    const before = oldLabels.get(f.value);
    if (before && before !== f.label) renamed.set(before.trim().toLowerCase(), f.label);
  }

  const exists = new Set(filters.map((f) => f.value));
  const projects = next.projects.map((p) => ({
    ...p,
    category: renamed.get(p.category.trim().toLowerCase()) ?? p.category,
    tags: p.tags.filter((t) => exists.has(t)),
  }));

  return { ...next, works: { ...next.works, allLabel, filters }, projects };
}
