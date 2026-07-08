"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { MailWarning, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export function VerifyEmailBanner() {
  const { data: session, status } = useSession();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Only nudge signed-in users whose email isn't verified yet.
  if (status !== "authenticated" || session.user?.isEmailVerified !== false) {
    return null;
  }

  const resend = async () => {
    if (!session.user?.email) return;
    setSending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSent(true);
        toast.success("Verification email sent — check your inbox.");
      } else {
        toast.error(data.error || "Couldn't send the email. Please try again.");
      }
    } catch {
      toast.error("Couldn't send the email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full border-b border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/25 dark:bg-amber-950/40 dark:text-amber-100">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-4 py-2.5 text-sm sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-200/70 dark:bg-amber-800/50">
            <MailWarning className="size-3.5" />
          </span>
          <span className="min-w-0">
            <span className="font-semibold">Verify your email</span>
            <span className="hidden text-amber-800/90 dark:text-amber-200/80 sm:inline">
              {" "}to post listings and contact sellers — we sent a link to{" "}
              <span className="font-medium">{session.user?.email}</span>.
            </span>
          </span>
        </div>
        {sent ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 font-medium">
            <Check className="size-4" /> Sent — check your inbox
          </span>
        ) : (
          <button
            type="button"
            onClick={resend}
            disabled={sending}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-900 px-3.5 py-1.5 text-xs font-semibold text-amber-50 transition-colors hover:bg-amber-800 disabled:opacity-60 dark:bg-amber-100 dark:text-amber-950 dark:hover:bg-white"
          >
            {sending && <Loader2 className="size-3.5 animate-spin" />}
            Resend email
          </button>
        )}
      </div>
    </div>
  );
}
