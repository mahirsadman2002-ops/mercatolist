"use client";

/**
 * Lightweight cross-component signal for "the unread/notification badges are
 * stale, refetch now". The Header and dashboard layout each poll the
 * unread-count every 30s; without this, reading a message wouldn't clear the
 * red badge until the next poll (feels like a 1-2 minute lag). Anything that
 * changes unread state (opening a thread, marking read) calls
 * notifyBadgeRefresh() and the badges update immediately.
 */
export const BADGE_REFRESH_EVENT = "ml:refresh-badges";

export function notifyBadgeRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(BADGE_REFRESH_EVENT));
  }
}
