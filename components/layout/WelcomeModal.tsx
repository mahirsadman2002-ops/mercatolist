"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Store, TrendingUp, MessageSquareHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Stores the last date (YYYY-MM-DD) the modal was shown, so it appears at most
// once per day per browser — even for returning visitors.
const STORAGE_KEY = "ml_welcome_last_shown";
const SHOW_DELAY_MS = 30_000;

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (localStorage.getItem(STORAGE_KEY) !== today()) {
        // Wait ~30s so we don't interrupt someone who's actively browsing or
        // searching the moment they land.
        timer = setTimeout(() => {
          setOpen(true);
          try {
            localStorage.setItem(STORAGE_KEY, today());
          } catch {
            // ignore
          }
        }, SHOW_DELAY_MS);
      }
    } catch {
      // localStorage unavailable (private mode) — just don't show it.
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-heading text-lg font-bold tracking-tight">MercatoList</span>
            <span className="rounded-full border border-accent/40 bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wider text-accent">
              Beta
            </span>
          </div>
          <DialogTitle className="text-2xl">Welcome — thanks for stopping by 👋</DialogTitle>
        </DialogHeader>

        {/* Spaced-out points with icons for quick, friendly reading */}
        <div className="space-y-4 py-1">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Building2 className="size-4" />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              NYC&apos;s marketplace for buying and selling businesses — across all five boroughs.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <TrendingUp className="size-4" />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We&apos;re growing fast, with new listings added every day. Check back often!
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <MessageSquareHeart className="size-4" />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Found a bug or have an idea? Tap the <span className="font-medium text-foreground">Feedback</span> button anytime — it really helps.
            </p>
          </div>
        </div>

        <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button asChild className="gap-2" onClick={() => setOpen(false)}>
            <Link href="/listings">
              <Store className="size-4" /> Browse Businesses
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2" onClick={() => setOpen(false)}>
            <Link href="/list-your-business">
              <Building2 className="size-4" /> Sell Your Business
            </Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mx-auto text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Maybe later — just browsing
        </button>
      </DialogContent>
    </Dialog>
  );
}
