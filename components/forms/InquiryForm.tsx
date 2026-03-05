"use client";

import { useState, useCallback, type FormEvent } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface InquiryFormProps {
  listingId: string;
  listingTitle: string;
  trigger?: React.ReactNode;
}

export function InquiryForm({ listingId, listingTitle, trigger }: InquiryFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: `Hi, I'm interested in "${listingTitle}". Could you provide more information?`,
    _hp: "", // honeypot
  });

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
        toast.error("Please fill in all required fields.");
        return;
      }

      setIsSubmitting(true);

      try {
        const res = await fetch("/api/inquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId,
            senderName: formData.name,
            senderEmail: formData.email,
            senderPhone: formData.phone || undefined,
            message: formData.message,
            _hp: formData._hp || undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to send inquiry");
        }

        setIsSuccess(true);
        toast.success("Inquiry sent! The seller will be in touch.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Something went wrong. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, listingId]
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      // Reset on close
      setIsSuccess(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: `Hi, I'm interested in "${listingTitle}". Could you provide more information?`,
        _hp: "",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full" size="lg">
            <Send className="size-4" />
            Send Inquiry
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send an Inquiry</DialogTitle>
          <DialogDescription>
            Contact the seller about &quot;{listingTitle}&quot;. No account required.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-800 dark:bg-emerald-950/30">
            <CheckCircle2 className="mx-auto mb-3 size-10 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Inquiry sent successfully!
            </p>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
              The listing contact will respond to your email.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => handleOpenChange(false)}
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot — hidden from real users */}
            <input
              type="text"
              name="_hp"
              value={formData._hp}
              onChange={(e) => setFormData((p) => ({ ...p, _hp: e.target.value }))}
              className="absolute -left-[9999px] -top-[9999px] opacity-0 h-0 w-0"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <div className="space-y-1.5">
              <Label htmlFor="inq-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="inq-name"
                placeholder="Your full name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inq-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="inq-email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inq-phone">Phone (optional)</Label>
              <Input
                id="inq-phone"
                type="tel"
                placeholder="(212) 555-0100"
                value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inq-message">
                Message <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="inq-message"
                placeholder="Write your message..."
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Submit Inquiry
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
