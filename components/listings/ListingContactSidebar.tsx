"use client";

import { useState, useCallback, type FormEvent } from "react";
import Link from "next/link";
import {
  Eye,
  Heart,
  Calendar,
  Phone,
  Mail,
  Share2,
  Flag,
  Link2,
  User,
  Building2,
  Send,
  MessageSquare,
  Shield,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { cn, calculateDaysOnMarket, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListingContactSidebarProps {
  listing: {
    id: string;
    slug: string;
    title: string;
    viewCount: number;
    saveCount: number;
    shareCount: number;
    showPhoneNumber: boolean;
    isGhostListing: boolean;
    shareToken?: string | null;
    createdAt: string | Date;
    listedBy: {
      id: string;
      name: string;
      displayName?: string | null;
      avatarUrl?: string | null;
      role: string;
      brokerageName?: string | null;
      brokeragePhone?: string | null;
      phone?: string | null;
      email: string;
    };
    coBrokers?: {
      id: string;
      name: string;
      displayName?: string | null;
      avatarUrl?: string | null;
      brokerageName?: string | null;
      phone?: string | null;
    }[];
  };
  isSaved?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

function getProfileUrl(userId: string, role: string): string {
  if (role === "BROKER") {
    return `/brokers/${userId}`;
  }
  return `/profile/${userId}`;
}

const REPORT_REASONS = [
  { value: "INACCURATE", label: "Inaccurate information" },
  { value: "SUSPICIOUS", label: "Suspicious listing" },
  { value: "DUPLICATE", label: "Duplicate listing" },
  { value: "SPAM", label: "Spam" },
  { value: "OTHER", label: "Other" },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Listing stats row at the top of the sidebar */
function ListingStats({
  viewCount,
  saveCount,
  createdAt,
}: {
  viewCount: number;
  saveCount: number;
  createdAt: string | Date;
}) {
  const daysOnMarket = calculateDaysOnMarket(
    typeof createdAt === "string" ? new Date(createdAt) : createdAt
  );

  return (
    <div className="flex items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
      <div className="flex items-center gap-1" title="Views">
        <Eye className="size-3.5" />
        <span>{formatNumber(viewCount)}</span>
      </div>
      <div className="flex items-center gap-1" title="Saves">
        <Heart className="size-3.5" />
        <span>{formatNumber(saveCount)}</span>
      </div>
      <div className="flex items-center gap-1" title="Days on market">
        <Calendar className="size-3.5" />
        <span>
          {daysOnMarket} {daysOnMarket === 1 ? "day" : "days"}
        </span>
      </div>
    </div>
  );
}

/** A single broker/user card */
function AgentCard({
  user,
  showPhoneNumber,
  isCoBroker = false,
}: {
  user: {
    id: string;
    name: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    role?: string;
    brokerageName?: string | null;
    brokeragePhone?: string | null;
    phone?: string | null;
    email?: string;
  };
  showPhoneNumber: boolean;
  isCoBroker?: boolean;
}) {
  const displayName = user.displayName || user.name;
  const initials = getInitials(displayName);
  const isBroker = user.role === "BROKER";
  const phone = user.phone || user.brokeragePhone;
  const profileUrl = getProfileUrl(user.id, user.role || "USER");

  return (
    <div className="flex items-start gap-3">
      <Avatar size="lg">
        {user.avatarUrl && (
          <AvatarImage src={user.avatarUrl} alt={displayName} />
        )}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{displayName}</span>
          {!isCoBroker && (
            <Badge
              variant={isBroker ? "default" : "secondary"}
              className="text-[10px] px-1.5 py-0"
            >
              {isBroker ? "Broker" : "Owner"}
            </Badge>
          )}
        </div>

        {isBroker && user.brokerageName && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="size-3 shrink-0" />
            <span className="truncate">{user.brokerageName}</span>
          </div>
        )}

        {showPhoneNumber && phone && (
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="size-3 shrink-0" />
            <span>{formatPhoneDisplay(phone)}</span>
          </a>
        )}

        <Link
          href={profileUrl}
          className="mt-0.5 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <User className="size-3" />
          View Profile
        </Link>
      </div>
    </div>
  );
}

/** Inline inquiry form */
function InquirySection({
  listingId,
  listingTitle,
}: {
  listingId: string;
  listingTitle: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: `Hi, I'm interested in "${listingTitle}". Could you provide more information?`,
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
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to send inquiry");
        }

        setIsSuccess(true);
        toast.success("Inquiry sent successfully! The seller will be in touch.");
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

  if (!isOpen) {
    return (
      <Button className="w-full" size="lg" onClick={() => setIsOpen(true)}>
        <Send className="size-4" />
        Send Inquiry
      </Button>
    );
  }

  if (isSuccess) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-800 dark:bg-emerald-950/30">
        <CheckCircle2 className="mx-auto mb-2 size-8 text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
          Inquiry sent successfully!
        </p>
        <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
          The listing contact will respond to your email.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Send an Inquiry</h4>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inquiry-name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="inquiry-name"
          placeholder="Your full name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inquiry-email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="inquiry-email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inquiry-phone">Phone (optional)</Label>
        <Input
          id="inquiry-phone"
          type="tel"
          placeholder="(212) 555-0100"
          value={formData.phone}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, phone: e.target.value }))
          }
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inquiry-message">
          Message <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="inquiry-message"
          placeholder="Write your message..."
          rows={4}
          value={formData.message}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, message: e.target.value }))
          }
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
  );
}

/** Report listing dialog */
function ReportListingDialog({ listingId }: { listingId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!reason) {
        toast.error("Please select a reason for the report.");
        return;
      }

      setIsSubmitting(true);

      try {
        const res = await fetch(`/api/listings/${listingId}/report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason, details: details || undefined }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to submit report");
        }

        toast.success("Report submitted. Thank you for helping us keep MercatoList safe.");
        setIsOpen(false);
        setReason("");
        setDetails("");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Something went wrong. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [listingId, reason, details]
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <Flag className="size-3" />
          Report this listing
        </button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Report Listing</DialogTitle>
            <DialogDescription>
              Let us know why you think this listing should be reviewed. All reports
              are handled confidentially.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="report-reason">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="report-reason" className="w-full">
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="report-details">Additional details</Label>
              <Textarea
                id="report-details"
                placeholder="Provide any additional context..."
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting || !reason}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ListingContactSidebar({
  listing,
  isSaved: initialIsSaved = false,
}: ListingContactSidebarProps) {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isSaving, setIsSaving] = useState(false);

  // ---- Save / Unsave ----
  const handleToggleSave = useCallback(async () => {
    setIsSaving(true);
    const previousState = isSaved;
    setIsSaved(!isSaved);

    try {
      const res = await fetch(`/api/listings/${listing.id}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        setIsSaved(previousState);
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update save");
      }

      toast.success(previousState ? "Listing unsaved" : "Listing saved!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save listing. Try again."
      );
      setIsSaved(previousState);
    } finally {
      setIsSaving(false);
    }
  }, [isSaved, listing.id]);

  // ---- Share ----
  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/listings/${listing.slug}`;

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      toast.success("Link copied!");
    }
  }, [listing.slug]);

  // ---- Message Seller (placeholder) ----
  const handleMessageSeller = useCallback(() => {
    toast.info("Login required to send messages", {
      description: "Create an account or sign in to message the seller directly.",
      action: {
        label: "Sign in",
        onClick: () => {
          window.location.href = "/login";
        },
      },
    });
  }, []);

  // ---- Ghost listing share link ----
  const ghostShareUrl =
    listing.isGhostListing && listing.shareToken
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/listings/ghost/${listing.shareToken}`
      : null;

  return (
    <div className="space-y-4">
      {/* ---- Ghost Listing Banner ---- */}
      {listing.isGhostListing && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950/30">
          <Shield className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              This is a private listing
            </p>
            {ghostShareUrl && (
              <div className="mt-2 flex items-center gap-2">
                <Input
                  readOnly
                  value={ghostShareUrl}
                  className="h-7 text-xs"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    navigator.clipboard.writeText(ghostShareUrl);
                    toast.success("Private link copied!");
                  }}
                >
                  <Link2 className="size-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Main Sidebar Card ---- */}
      <Card>
        {/* Listing Stats */}
        <CardHeader className="pb-0">
          <ListingStats
            viewCount={listing.viewCount}
            saveCount={listing.saveCount}
            createdAt={listing.createdAt}
          />
        </CardHeader>

        <CardContent className="space-y-5">
          {/* ---- Listed By ---- */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Listed By
            </h3>
            <AgentCard
              user={listing.listedBy}
              showPhoneNumber={listing.showPhoneNumber}
            />
          </div>

          {/* ---- Co-Brokers ---- */}
          {listing.coBrokers && listing.coBrokers.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Also Listed By
              </h3>
              <div className="space-y-3">
                {listing.coBrokers.map((broker) => (
                  <AgentCard
                    key={broker.id}
                    user={{ ...broker, role: "BROKER" }}
                    showPhoneNumber={listing.showPhoneNumber}
                    isCoBroker
                  />
                ))}
              </div>
            </div>
          )}

          {/* ---- Contact Buttons ---- */}
          <div className="space-y-2 pt-1">
            <InquirySection
              listingId={listing.id}
              listingTitle={listing.title}
            />
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={handleMessageSeller}
            >
              <MessageSquare className="size-4" />
              Message Seller
            </Button>
          </div>

          {/* ---- Action Buttons Row ---- */}
          <div className="flex items-center gap-2">
            <Button
              variant={isSaved ? "default" : "outline"}
              className={cn("flex-1", isSaved && "bg-rose-500 hover:bg-rose-600 text-white")}
              onClick={handleToggleSave}
              disabled={isSaving}
            >
              <Heart
                className={cn("size-4", isSaved && "fill-current")}
              />
              {isSaved ? "Saved" : "Save"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleShare}>
              <Share2 className="size-4" />
              Share
            </Button>
          </div>

          {/* ---- Report Link ---- */}
          <div className="flex justify-center pt-1">
            <ReportListingDialog listingId={listing.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
