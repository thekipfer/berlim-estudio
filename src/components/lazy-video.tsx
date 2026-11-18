"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Muted looping background video that only downloads when it gets near the screen.
 * Until then (and if autoplay is blocked) the poster shows, exactly like a normal autoplay video.
 */
export function LazyVideo({ src, poster, className }: { src: string; poster: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (!("IntersectionObserver" in window)) return setNear(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={near ? src : undefined}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload={near ? "auto" : "none"}
      aria-hidden="true"
      className={className}
    />
  );
}
