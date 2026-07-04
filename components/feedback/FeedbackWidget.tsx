"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Bug, Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type FeedbackType = "BUG" | "IDEA";

export function FeedbackWidget() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("BUG");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (message.trim().length < 5) {
      toast.error("Please add a little more detail.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message,
          email: email || session?.user?.email || "",
          pageUrl: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Thank you! Your feedback helps us improve MercatoList.");
        setMessage("");
        setEmail("");
        setType("BUG");
        setOpen(false);
      } else {
        toast.error(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Give feedback or report a bug"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-red-700 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
      >
        <Bug className="h-4 w-4" />
        <span>Feedback / Report Bug</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Report a bug or share an idea</DialogTitle>
          </DialogHeader>

          {/* Disclaimer */}
          <div className="rounded-md border border-accent/30 bg-accent/10 p-3 text-sm text-muted-foreground">
            MercatoList is brand new, and we&apos;re still polishing things. If
            something looks off or you have an idea, please tell us — every
            report genuinely helps us make the platform better. Thank you for
            your patience and for being an early user! 🙏
          </div>

          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("BUG")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                type === "BUG"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-input text-muted-foreground hover:bg-muted"
              )}
            >
              <Bug className="h-4 w-4" /> Bug
            </button>
            <button
              type="button"
              onClick={() => setType("IDEA")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                type === "IDEA"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-input text-muted-foreground hover:bg-muted"
              )}
            >
              <Lightbulb className="h-4 w-4" /> Idea
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-message">
              {type === "BUG" ? "What went wrong?" : "What's your idea?"}
            </Label>
            <Textarea
              id="feedback-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                type === "BUG"
                  ? "Describe what happened and what you expected..."
                  : "Tell us what would make MercatoList better..."
              }
            />
          </div>

          {!session?.user?.email && (
            <div className="space-y-2">
              <Label htmlFor="feedback-email">Email (optional)</Label>
              <Input
                id="feedback-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="So we can follow up if needed"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              <X className="mr-1 h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Sending..." : "Send feedback"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
