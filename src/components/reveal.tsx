"use client";

import type { ReactNode } from "react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Classes applied (≥769px only) before the element is revealed. */
  hiddenClassName: string;
  /** Smoove offset, e.g. "30%" or "-10%". */
  offset?: string;
  /** Use "span" inside headings or paragraphs. */
  as?: "div" | "span";
}

/** jQuery Smoove equivalent: animates once when scrolled into view (disabled below 769px). */
export function Reveal({ children, className, hiddenClassName, offset = "30%", as = "div" }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>(offset);
  const classes = cn(className, !inView && hiddenClassName);
  if (as === "span") {
    return (
      <span ref={ref as unknown as React.Ref<HTMLSpanElement>} className={classes}>
        {children}
      </span>
    );
  }
  return (
    <div ref={ref} className={classes}>
      {children}
    </div>
  );
}
