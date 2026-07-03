"use client";

import { useEffect } from "react";

/**
 * Fires a single "site visit" beacon per browser per day. The localStorage
 * guard means a returning visitor who loads 50 pages still only makes ONE
 * tracking request that day — keeping DB writes (and cost) minimal. The server
 * endpoint is also idempotent + rate-limited as a backstop.
 */
export function VisitTracker() {
  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const key = "ml_visit_day";
      if (localStorage.getItem(key) === today) return; // already counted today

      // Optimistically mark first so a double-mount doesn't double-fire.
      localStorage.setItem(key, today);

      fetch("/api/track/visit", {
        method: "POST",
        keepalive: true,
        credentials: "same-origin",
      }).catch(() => {
        // On failure, clear the guard so the next load retries.
        try {
          localStorage.removeItem(key);
        } catch {
          /* ignore */
        }
      });
    } catch {
      /* localStorage unavailable (private mode) — skip tracking silently */
    }
  }, []);

  return null;
}
