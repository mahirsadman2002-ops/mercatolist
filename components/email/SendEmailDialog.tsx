"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-filled recipient email — editable */
  defaultTo?: string;
  /** Pre-filled subject — editable */
  defaultSubject?: string;
  /** Pre-filled message body — editable */
  defaultMessage?: string;
  /** Dialog title */
  title?: string;
  /** Dialog description */
  description?: string;
  /** Called after successful send */
  onSuccess?: () => void;
}

export function SendEmailDialog({
  open,
  onOpenChange,
  defaultTo = "",
  defaultSubject = "",
  defaultMessage = "",
  title = "Send Email",
  description = "Send an email through MercatoList",
  onSuccess,
}: SendEmailDialogProps) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Reset form when dialog opens with new defaults
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setTo(defaultTo);
      setSubject(defaultSubject);
      setMessage(defaultMessage);
      setSent(false);
    }
    onOpenChange(isOpen);
  };

  const handleSend = async () => {
    if (!to || !subject || !message) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      setSent(true);
      toast.success("Email sent successfully!");
      onSuccess?.();

      // Auto-close after a moment
      setTimeout(() => {
        handleOpenChange(false);
      }, 1500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="size-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle2 className="size-12 text-emerald-500" />
            <p className="text-lg font-semibold">Email Sent!</p>
            <p className="text-sm text-muted-foreground">
              Your message has been delivered to {to}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="email-to">To</Label>
                <Input
                  id="email-to"
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="recipient@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email-message">
                  Message ({message.length}/2000)
                </Label>
                <Textarea
                  id="email-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                  placeholder="Write your message..."
                  rows={6}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={sending || !to || !subject || !message}
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {sending ? "Sending..." : "Send Email"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
