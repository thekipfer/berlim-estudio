"use client";

import { useState } from "react";
import { WorkCard } from "@/components/work-card";
import { cn } from "@/lib/utils";
import type { FilterTab, PortfolioItem } from "@/types/content";

/** Filter tabs + 2-column portfolio grid (theme's "Portfolio Masonry" widget). */
export function OurWorksGrid({ items, filters, allLabel }: { items: PortfolioItem[]; filters: FilterTab[]; allLabel: string }) {
  const tabs = [{ label: allLabel, value: "all" }, ...filters.filter((f) => f.value !== "all")];
  const [filter, setFilter] = useState("all");
  const visible = filter === "all" ? items : items.filter((item) => item.tags?.includes(filter));

  return (
    <section>
      <div className="mx-auto max-w-[1140px] px-5 pb-10 tab:px-[30px] desk:px-0">
        <div className="mb-10 text-center" role="group" aria-label="Filtrar trabalhos">
          {tabs.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "mx-[10px] inline-block cursor-pointer border-b text-base leading-[1.6] text-black lowercase transition-colors duration-300 hover:border-black tab:text-[18px]",
                filter === f.value ? "border-black" : "border-transparent",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Re-keyed on filter change so the cards fade back in, like the theme's isotope shuffle. */}
        <div key={filter} className="flex animate-[works-in_0.5s_ease-out] flex-wrap justify-between">
          {visible.map((item, i) => (
            <WorkCard key={item.href} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
