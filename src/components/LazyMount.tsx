"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Defers mounting expensive children (e.g. the Leaflet map + its JS chunk)
// until the wrapper scrolls near the viewport, instead of paying that cost
// on every page load regardless of whether the visitor ever scrolls there.
export default function LazyMount({
  children,
  placeholder,
  rootMargin = "300px",
}: {
  children: ReactNode;
  placeholder: ReactNode;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    // Safety net: browsers/environments where IntersectionObserver never
    // fires (or the element starts already on-screen on a short page)
    // shouldn't leave this stuck on the placeholder forever.
    const fallback = setTimeout(() => setVisible(true), 4000);
    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, [rootMargin]);

  return <div ref={ref}>{visible ? children : placeholder}</div>;
}
