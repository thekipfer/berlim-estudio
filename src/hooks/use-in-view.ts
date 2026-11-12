"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fires once when the element enters the viewport.
 * `bottomOffset` mirrors jQuery Smoove's `offset` option: a positive % means the
 * element must rise that far above the viewport bottom; a negative % fires early.
 */
export function useInView<T extends Element>(bottomOffset = "0%") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const pct = parseFloat(bottomOffset);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: `0px 0px ${-pct}% 0px`, threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [bottomOffset, inView]);

  return { ref, inView };
}
