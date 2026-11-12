"use client";

import { useEffect, useState } from "react";

/** True once the window has scrolled at least `threshold` px. */
export function useScrollPast(threshold: number) {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const update = () => setPast(window.scrollY >= threshold);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);

  return past;
}
