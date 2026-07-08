"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
}

export function ScrollReveal({ children, className, stagger }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reveal = () => el.classList.add("in-view");

    // If IntersectionObserver is unavailable, just show the content.
    if (typeof IntersectionObserver === "undefined") {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);

    // Safety net: some browsers (notably iOS Safari) intermittently fail to
    // fire the observer for content already on screen at load, which would
    // leave the section permanently invisible (opacity:0). Force-reveal after
    // a moment so content is NEVER stuck hidden. Also reveal immediately if
    // the element is already within the viewport on mount.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) reveal();
    const fallback = setTimeout(reveal, 1200);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "scroll-reveal",
        stagger && "scroll-reveal-stagger",
        className
      )}
    >
      {children}
    </div>
  );
}
