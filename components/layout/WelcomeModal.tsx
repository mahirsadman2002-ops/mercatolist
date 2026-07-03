"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const STORAGE_KEY = "ml_welcome_seen_v1";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  // First-visit only: gate on a localStorage flag so it never nags returning
  // visitors. Runs after mount to avoid SSR/hydration mismatch.
  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
      }
    } catch {
      // localStorage unavailable (private mode, etc.) — just don't show it.
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <span className="font-heading text-lg font-bold tracking-tight">MercatoList</span>
            <span className="rounded-full border border-accent/40 bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wider text-accent">
              Beta
            </span>
          </div>
          <DialogTitle className="text-2xl">Thanks for visiting MercatoList</DialogTitle>
          <DialogDescription className="text-base">
            You&apos;re one of our earliest visitors — welcome! We&apos;re just getting
            started, and new businesses are being added every day. Be sure to check
            back often as our NYC marketplace grows.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button asChild className="h-auto flex-col items-start gap-1 py-3" onClick={dismiss}>
            <Link href="/listings">
              <span className="flex items-center gap-2 font-semibold">
                <Store className="h-4 w-4" /> Browse Businesses
              </span>
              <span className="text-xs font-normal opacity-80">See what&apos;s for sale in NYC</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col items-start gap-1 py-3" onClick={dismiss}>
            <Link href="/list-your-business">
              <span className="flex items-center gap-2 font-semibold">
                <Building2 className="h-4 w-4" /> Sell Your Business
              </span>
              <span className="text-xs font-normal opacity-70">List in minutes, reach NYC buyers</span>
            </Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="mx-auto mt-1 text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Just browsing — take me to the site
        </button>
      </DialogContent>
    </Dialog>
  );
}
