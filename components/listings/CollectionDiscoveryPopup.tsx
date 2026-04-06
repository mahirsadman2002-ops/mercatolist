"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ── Constants ────────────────────────────────────────────────────────

const LS_LAST_SHOWN = "collection_popup_last_shown";
const LS_DISMISS_COUNT = "collection_popup_dismiss_count";
const MAX_DISMISS_COUNT = 3;
const SHOW_DELAY_MS = 5_000;
const MOBILE_BREAKPOINT = 768;

// ── Props ────────────────────────────────────────────────────────────

interface CollectionDiscoveryPopupProps {
  isLoggedIn: boolean;
  hasCollections: boolean;
  listingSlug: string;
  onCreateCollection: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function shouldShowPopup(hasCollections: boolean): boolean {
  if (typeof window === "undefined") return false;

  // Don't show on mobile
  if (window.innerWidth < MOBILE_BREAKPOINT) return false;

  // Don't show if user already has collections
  if (hasCollections) return false;

  // Don't show if dismissed 3+ times total
  const dismissCount = parseInt(
    localStorage.getItem(LS_DISMISS_COUNT) || "0",
    10
  );
  if (dismissCount >= MAX_DISMISS_COUNT) return false;

  // Don't show if already shown today
  const lastShown = localStorage.getItem(LS_LAST_SHOWN);
  if (lastShown === getTodayKey()) return false;

  return true;
}

// ── Component ────────────────────────────────────────────────────────

export function CollectionDiscoveryPopup({
  isLoggedIn,
  hasCollections,
  listingSlug,
  onCreateCollection,
}: CollectionDiscoveryPopupProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!shouldShowPopup(hasCollections)) return;

    const timer = setTimeout(() => {
      // Re-check in case conditions changed during the delay
      if (!shouldShowPopup(hasCollections)) return;

      localStorage.setItem(LS_LAST_SHOWN, getTodayKey());
      setOpen(true);
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [hasCollections]);

  const handleDismiss = () => {
    const current = parseInt(
      localStorage.getItem(LS_DISMISS_COUNT) || "0",
      10
    );
    localStorage.setItem(LS_DISMISS_COUNT, String(current + 1));
    setOpen(false);
  };

  const handleDontShowAgain = () => {
    localStorage.setItem(LS_DISMISS_COUNT, "999");
    setOpen(false);
  };

  const handleCTA = () => {
    if (isLoggedIn) {
      onCreateCollection();
      setOpen(false);
    } else {
      router.push(
        `/signup-prompt?action=collection&callbackUrl=/listings/${encodeURIComponent(listingSlug)}`
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && handleDismiss()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950/40">
            <FolderOpen className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>
          <DialogTitle className="text-xl font-bold">
            Organize Your Business Search
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Collections help you group, compare, and track the businesses
            you&apos;re interested in.
          </DialogDescription>
        </DialogHeader>

        <ul className="my-2 space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <span className="text-lg leading-none" aria-hidden="true">
              📁
            </span>
            <span>Group listings by type, location, or budget</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg leading-none" aria-hidden="true">
              🔔
            </span>
            <span>
              Get notified when a listing in your collection changes
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg leading-none" aria-hidden="true">
              📤
            </span>
            <span>
              Share collections with your advisor or business partner
            </span>
          </li>
        </ul>

        <Button
          onClick={handleCTA}
          className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
        >
          Create Your First Collection
        </Button>

        <button
          type="button"
          onClick={handleDontShowAgain}
          className="mx-auto block text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          Don&apos;t show again
        </button>
      </DialogContent>
    </Dialog>
  );
}
