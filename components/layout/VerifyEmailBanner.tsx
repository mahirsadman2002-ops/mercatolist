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
    <div className="w-full border-b border-amber-300/60 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200">
      <div className="container mx-auto flex flex-col items-center justify-center gap-2 px-4 py-2 text-sm sm:flex-row sm:gap-3">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <MailWarning className="size-4 shrink-0" />
          <span>
            Please verify your email to post listings and contact sellers. We sent a link to{" "}
            <span className="font-medium">{session.user?.email}</span>.
          </span>
        </div>
        {sent ? (
          <span className="inline-flex items-center gap-1 font-medium">
            <Check className="size-4" /> Sent
          </span>
        ) : (
          <button
            type="button"
            onClick={resend}
            disabled={sending}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-amber-400/70 bg-amber-100/60 px-2.5 py-1 font-medium transition-colors hover:bg-amber-100 disabled:opacity-60 dark:bg-amber-900/40 dark:hover:bg-amber-900/70"
          >
            {sending && <Loader2 className="size-3.5 animate-spin" />}
            Resend email
          </button>
        )}
      </div>
    </div>
  );
}
