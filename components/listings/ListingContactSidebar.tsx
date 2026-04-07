"use client";

import { useState, useCallback, useEffect, useRef, type FormEvent } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { SendEmailDialog } from "@/components/email/SendEmailDialog";
import { useRouter, useSearchParams } from "next/navigation";
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
  Copy,
  Check,
  Twitter,
  Facebook,
  Linkedin,
  FolderPlus,
  Plus,
  Star,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";

import { cn, calculateDaysOnMarket, formatNumber, formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { CollectionNotesSection } from "@/components/collections/CollectionNotesSection";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListingContactSidebarProps {
  listing: {
    id: string;
    slug: string;
    title: string;
    askingPrice?: number | null;
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
  collectionId?: string;
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
    return `/advisors/${userId}`;
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
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex cursor-help items-center gap-1 transition-colors hover:text-foreground">
              <Eye className="size-3.5" />
              <span>{formatNumber(viewCount)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total number of times this listing has been viewed</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex cursor-help items-center gap-1 transition-colors hover:text-foreground">
              <Heart className="size-3.5" />
              <span>{formatNumber(saveCount)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Number of users who saved this listing to their favorites</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex cursor-help items-center gap-1 transition-colors hover:text-foreground">
              <Calendar className="size-3.5" />
              <span>
                {daysOnMarket} {daysOnMarket === 1 ? "day" : "days"}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Number of days since this listing was first published</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
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
          <Link href={profileUrl} className="truncate text-sm font-semibold hover:underline">{displayName}</Link>
          {!isCoBroker && (
            <Badge
              variant={isBroker ? "default" : "secondary"}
              className="text-[10px] px-1.5 py-0"
            >
              {isBroker ? "Business Advisor" : "Owner"}
            </Badge>
          )}
        </div>

        {isBroker && user.brokerageName && (
          <Link
            href={`/advisors/company/${encodeURIComponent(user.brokerageName)}`}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            <Building2 className="size-3 shrink-0" />
            <span className="truncate">{user.brokerageName}</span>
          </Link>
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

/** Contact dialog for sending a message to the listing owner */
function ContactDialog({
  listing,
  user,
  onSuccess,
  externalOpen,
  onExternalOpenChange,
}: {
  listing: ListingContactSidebarProps["listing"];
  user: { id: string; name?: string | null; email?: string | null; phone?: string | null } | null;
  onSuccess: () => void;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = onExternalOpenChange || setInternalOpen;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    message: "",
  });

  // Update form when user session loads
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user]);

  const isBroker = listing.listedBy.role === "BROKER";
  const contactName = listing.listedBy.displayName || listing.listedBy.name;
  const priceDisplay = listing.askingPrice ? formatCurrency(listing.askingPrice) : null;

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!formData.message.trim()) {
        toast.error("Please enter a message.");
        return;
      }

      setIsSubmitting(true);

      try {
        const res = await fetch("/api/inquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId: listing.id,
            message: formData.message,
            senderName: formData.name || undefined,
            senderEmail: formData.email || undefined,
            senderPhone: formData.phone || undefined,
            type: "MESSAGE_THREAD",
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to send message");
        }

        toast.success("Message sent! The listing contact will be in touch.");
        setIsOpen(false);
        setFormData((prev) => ({ ...prev, message: "" }));
        onSuccess();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Something went wrong. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, listing.id, onSuccess]
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Send className="size-4" />
          {isBroker ? "Contact Advisor" : "Contact Seller"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Contact {contactName}</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{listing.title}</span>
              {priceDisplay && (
                <span className="ml-1 text-muted-foreground">
                  &mdash; {priceDisplay}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="contact-name">Name</Label>
              <Input
                id="contact-name"
                placeholder="Your full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-phone">Phone (optional)</Label>
              <Input
                id="contact-phone"
                type="tel"
                placeholder="(212) 555-0100"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-message">
                Message <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="contact-message"
                placeholder={`Hi, I'm interested in "${listing.title}". Could you provide more details?`}
                rows={4}
                value={formData.message}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, message: e.target.value }))
                }
                required
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
            <Button type="submit" disabled={isSubmitting || !formData.message.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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

/** Star rating for a listing within a collection */
function CollectionStarRating({
  collectionId,
  listingId,
}: {
  collectionId: string;
  listingId: string;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current rating
  useEffect(() => {
    let cancelled = false;
    async function fetchRating() {
      try {
        const res = await fetch(
          `/api/collections/${collectionId}/listings/${listingId}/rate`
        );
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setRating(data.data?.personalRating ?? null);
          }
        }
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchRating();
    return () => {
      cancelled = true;
    };
  }, [collectionId, listingId]);

  const handleRate = useCallback(
    async (newRating: number) => {
      const prevRating = rating;
      setRating(newRating);
      setIsSaving(true);
      try {
        const res = await fetch(
          `/api/collections/${collectionId}/listings/${listingId}/rate`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rating: newRating }),
          }
        );
        if (!res.ok) {
          setRating(prevRating);
          throw new Error("Failed to save rating");
        }
        toast.success(`Rated ${newRating} star${newRating !== 1 ? "s" : ""}`);
      } catch {
        toast.error("Could not save rating. Try again.");
        setRating(prevRating);
      } finally {
        setIsSaving(false);
      }
    },
    [collectionId, listingId, rating]
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Star className="size-3.5 text-amber-500" />
        <span className="text-xs text-muted-foreground">Loading rating...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Your Rating
      </h3>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= (hoveredStar ?? rating ?? 0);
          return (
            <button
              key={star}
              type="button"
              disabled={isSaving}
              className="p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(null)}
              onClick={() => handleRate(star)}
              aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  "size-5 transition-colors",
                  isFilled
                    ? "fill-amber-400 text-amber-400"
                    : "fill-none text-gray-300"
                )}
              />
            </button>
          );
        })}
        {rating && (
          <span className="ml-1.5 text-xs text-muted-foreground">
            {rating}/5
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collection types
// ---------------------------------------------------------------------------

interface CollectionItem {
  id: string;
  name: string;
  listings?: { id: string }[];
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ListingContactSidebar({
  listing,
  collectionId,
  isSaved: initialIsSaved = false,
}: ListingContactSidebarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExistingConversation, setHasExistingConversation] = useState(false);

  // Contact dialog external state (for auto-action)
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  // Collection state
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [collectionPopoverOpen, setCollectionPopoverOpen] = useState(false);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [togglingCollectionId, setTogglingCollectionId] = useState<string | null>(null);

  const currentUser = session?.user as
    | { id: string; name?: string | null; email?: string | null; phone?: string | null }
    | undefined;
  const isOwner = currentUser?.id === listing.listedBy.id;
  const isBroker = listing.listedBy.role === "BROKER";
  const isCurrentUserBroker = (session?.user as { role?: string } | undefined)?.role === "BROKER";
  const phone = listing.listedBy.phone || listing.listedBy.brokeragePhone;

  // Share with Client state
  const [clients, setClients] = useState<{ id: string; name: string; email: string }[]>([]);
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [sendingToClientId, setSendingToClientId] = useState<string | null>(null);

  // Track whether auto-action has been executed
  const autoActionExecuted = useRef(false);

  // Check if logged-in user already has a conversation for this listing
  useEffect(() => {
    if (!currentUser?.id || isOwner) return;

    let cancelled = false;

    async function checkExistingConversation() {
      try {
        const res = await fetch(`/api/inquiries?listingId=${listing.id}&type=MESSAGE_THREAD`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.data && data.data.length > 0) {
            setHasExistingConversation(true);
          }
        }
      } catch {
        // Silently fail -- user can still use the contact button
      }
    }

    checkExistingConversation();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, listing.id, isOwner]);

  // Fetch user's collections on mount (for logged-in users)
  const fetchCollections = useCallback(async () => {
    if (!currentUser?.id) return;
    setIsLoadingCollections(true);
    try {
      const res = await fetch("/api/collections");
      if (res.ok) {
        const data = await res.json();
        setCollections(data.data || []);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoadingCollections(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Auto-action from URL params (runs once on mount)
  useEffect(() => {
    if (autoActionExecuted.current) return;
    const autoAction = searchParams.get("autoAction");
    if (!autoAction || !currentUser?.id) return;

    autoActionExecuted.current = true;

    const cleanUrl = () => {
      router.replace(`/listings/${listing.slug}`, { scroll: false });
    };

    if (autoAction === "save") {
      // Auto-save the listing
      (async () => {
        try {
          const res = await fetch(`/api/listings/${listing.id}/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          if (res.ok) {
            setIsSaved(true);
            toast.success("Listing saved!");
          }
        } catch {
          // Silently fail
        }
        cleanUrl();
      })();
    } else if (autoAction === "contact") {
      setContactDialogOpen(true);
      cleanUrl();
    } else if (autoAction === "collection") {
      setCollectionPopoverOpen(true);
      cleanUrl();
    }
  }, [searchParams, currentUser?.id, listing.slug, listing.id, router]);

  // ---- Save / Unsave ----
  const handleToggleSave = useCallback(async () => {
    if (!currentUser?.id) {
      // FIX: Include autoAction=save so the listing auto-saves after signup redirect
      router.push(`/signup-prompt?action=save&callbackUrl=${encodeURIComponent(`/listings/${listing.slug}?autoAction=save`)}`);
      return;
    }

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

      toast.success(previousState ? "Removed from saves" : "Listing saved!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save listing. Try again."
      );
      setIsSaved(previousState);
    } finally {
      setIsSaving(false);
    }
  }, [isSaved, listing.id, listing.slug, currentUser?.id, router]);

  // ---- Share ----
  const [linkCopied, setLinkCopied] = useState(false);

  const getShareUrl = useCallback(() => {
    return `${window.location.origin}/listings/${listing.slug}`;
  }, [listing.slug]);

  const handleShare = useCallback(async () => {
    const url = getShareUrl();

    // Use Web Share API on mobile if available
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          url,
        });
        return;
      } catch {
        // User cancelled or API failed -- fall through
      }
    }
  }, [listing.title, getShareUrl]);

  const handleCopyLink = useCallback(async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setLinkCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  }, [getShareUrl]);

  // Email dialog state for sharing via platform email
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const handleShareViaEmail = useCallback(() => {
    setEmailDialogOpen(true);
  }, []);

  const handleShareOnTwitter = useCallback(() => {
    const url = getShareUrl();
    const text = encodeURIComponent(`Check out "${listing.title}" on MercatoList`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, "_blank");
  }, [listing.title, getShareUrl]);

  const handleShareOnFacebook = useCallback(() => {
    const url = getShareUrl();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
  }, [getShareUrl]);

  const handleShareOnLinkedIn = useCallback(() => {
    const url = getShareUrl();
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
  }, [getShareUrl]);

  const handleShareOnWhatsApp = useCallback(() => {
    const url = getShareUrl();
    const text = encodeURIComponent(`Check out "${listing.title}" on MercatoList: ${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }, [listing.title, getShareUrl]);

  // ---- Contact button click for unauthenticated users ----
  const handleUnauthContact = useCallback(() => {
    // FIX: Include autoAction=contact so the contact modal auto-opens after signup redirect
    router.push(`/signup-prompt?action=contact&callbackUrl=${encodeURIComponent(`/listings/${listing.slug}?autoAction=contact`)}`);
  }, [listing.slug, router]);

  // ---- Callback after successful contact ----
  const handleContactSuccess = useCallback(() => {
    setHasExistingConversation(true);
  }, []);

  // ---- Collection helpers ----
  const isListingInCollection = useCallback(
    (collection: CollectionItem) => {
      return collection.listings?.some((l) => l.id === listing.id) ?? false;
    },
    [listing.id]
  );

  const handleToggleCollection = useCallback(
    async (collection: CollectionItem) => {
      const isIn = isListingInCollection(collection);
      setTogglingCollectionId(collection.id);

      try {
        if (isIn) {
          const res = await fetch(
            `/api/collections/${collection.id}/listings/${listing.id}`,
            { method: "DELETE" }
          );
          if (!res.ok) throw new Error("Failed to remove from collection");
          toast.success(`Removed from "${collection.name}"`);
        } else {
          const res = await fetch(`/api/collections/${collection.id}/listings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listingId: listing.id }),
          });
          if (!res.ok) throw new Error("Failed to add to collection");
          toast.success(`Added to "${collection.name}"`);
        }
        // Refresh collections to get updated listing associations
        await fetchCollections();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setTogglingCollectionId(null);
      }
    },
    [listing.id, isListingInCollection, fetchCollections]
  );

  const handleCreateCollection = useCallback(async () => {
    const name = newCollectionName.trim();
    if (!name) return;

    setIsCreatingCollection(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to create collection");
      const data = await res.json();
      toast.success(`Collection "${name}" created`);
      setNewCollectionName("");
      setShowCreateInput(false);
      // Refresh collections and auto-add listing to new collection
      await fetchCollections();
      if (data.data?.id) {
        await fetch(`/api/collections/${data.data.id}/listings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId: listing.id }),
        });
        toast.success(`Added to "${name}"`);
        await fetchCollections();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create collection."
      );
    } finally {
      setIsCreatingCollection(false);
    }
  }, [newCollectionName, listing.id, fetchCollections]);

  const handleCollectionButtonClick = useCallback(() => {
    if (!currentUser?.id) {
      router.push(
        `/signup-prompt?action=collection&callbackUrl=${encodeURIComponent(`/listings/${listing.slug}?autoAction=collection`)}`
      );
      return;
    }
    setCollectionPopoverOpen(true);
  }, [currentUser?.id, listing.slug, router]);

  // ---- Share with Client (broker only) ----
  const fetchClients = useCallback(async () => {
    if (!isCurrentUserBroker) return;
    setIsLoadingClients(true);
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data.data || []);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoadingClients(false);
    }
  }, [isCurrentUserBroker]);

  const handleShareWithClient = useCallback(
    async (clientId: string, clientName: string) => {
      setSendingToClientId(clientId);
      try {
        const res = await fetch(`/api/clients/${clientId}/send-listing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId: listing.id }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to send listing");
        }
        toast.success(`Listing sent to ${clientName}`);
        setClientPopoverOpen(false);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setSendingToClientId(null);
      }
    },
    [listing.id]
  );

  const handleClientPopoverOpen = useCallback(
    (open: boolean) => {
      setClientPopoverOpen(open);
      if (open) {
        fetchClients();
      }
    },
    [fetchClients]
  );

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
        {/* 1. Listing Stats */}
        <CardHeader className="pb-0">
          <ListingStats
            viewCount={listing.viewCount}
            saveCount={listing.saveCount}
            createdAt={listing.createdAt}
          />
        </CardHeader>

        <CardContent className="space-y-5">
          {/* 2. Agent Card (Listed By) */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Listed By
            </h3>
            <AgentCard
              user={listing.listedBy}
              showPhoneNumber={listing.showPhoneNumber}
            />
          </div>

          {/* Co-Brokers */}
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

          {/* Collection Notes (when viewing from collection context) */}
          {collectionId && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <StickyNote className="size-3.5 text-amber-600" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Collection Notes
                </h3>
              </div>
              <CollectionNotesSection
                collectionId={collectionId}
                listingId={listing.id}
              />
            </div>
          )}

          {/* Collection Rating (when viewing from collection context) */}
          {collectionId && (
            <CollectionStarRating
              collectionId={collectionId}
              listingId={listing.id}
            />
          )}

          {/* 3. Contact Button (single, dynamic) */}
          {!isOwner && (
            <div className="space-y-2 pt-1">
              {!currentUser?.id ? (
                /* Not logged in: redirect to signup prompt */
                <Button className="w-full" size="lg" onClick={handleUnauthContact}>
                  <Send className="size-4" />
                  {isBroker ? "Contact Advisor" : "Contact Seller"}
                </Button>
              ) : hasExistingConversation ? (
                /* Already contacted: link to inbox */
                <Button
                  className="w-full"
                  size="lg"
                  variant="outline"
                  onClick={() => router.push("/inquiries")}
                >
                  <MessageSquare className="size-4" />
                  Continue Conversation
                </Button>
              ) : (
                /* Logged in, no existing conversation: open contact dialog */
                <ContactDialog
                  listing={listing}
                  user={currentUser}
                  onSuccess={handleContactSuccess}
                  externalOpen={contactDialogOpen}
                  onExternalOpenChange={setContactDialogOpen}
                />
              )}

              {/* 4. Phone fallback */}
              {listing.showPhoneNumber && phone && (
                <p className="text-center text-xs text-muted-foreground">
                  Or call directly:{" "}
                  <a
                    href={`tel:${phone}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {formatPhoneDisplay(phone)}
                  </a>
                </p>
              )}
            </div>
          )}

          {/* 5. Action Buttons Row: Save | Share | Collection */}
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1" onClick={handleShare}>
                  <Share2 className="size-4" />
                  Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleCopyLink}>
                  {linkCopied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                  {linkCopied ? "Copied!" : "Copy Link"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareViaEmail}>
                  <Mail className="size-4" />
                  Share via Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareOnWhatsApp}>
                  <MessageSquare className="size-4" />
                  Share via WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareOnTwitter}>
                  <Twitter className="size-4" />
                  Share on X
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareOnFacebook}>
                  <Facebook className="size-4" />
                  Share on Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareOnLinkedIn}>
                  <Linkedin className="size-4" />
                  Share on LinkedIn
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Popover open={collectionPopoverOpen} onOpenChange={setCollectionPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={(e) => {
                    if (!currentUser?.id) {
                      e.preventDefault();
                      handleCollectionButtonClick();
                    }
                  }}
                >
                  <FolderPlus className="size-4" />
                  Collect
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-0">
                <div className="p-3 pb-2">
                  <p className="text-sm font-semibold">Add to Collection</p>
                </div>
                <Separator />
                <div className="max-h-48 overflow-y-auto p-2">
                  {isLoadingCollections ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : collections.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                      No collections yet. Create one below.
                    </p>
                  ) : (
                    collections.map((collection) => {
                      const isIn = isListingInCollection(collection);
                      const isToggling = togglingCollectionId === collection.id;
                      return (
                        <button
                          key={collection.id}
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent disabled:opacity-50"
                          onClick={() => handleToggleCollection(collection)}
                          disabled={isToggling}
                        >
                          {isToggling ? (
                            <Loader2 className="size-4 shrink-0 animate-spin" />
                          ) : (
                            <Checkbox
                              checked={isIn}
                              className="pointer-events-none"
                              tabIndex={-1}
                            />
                          )}
                          <span className="truncate">{collection.name}</span>
                        </button>
                      );
                    })
                  )}
                </div>
                <Separator />
                <div className="p-2">
                  {showCreateInput ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        placeholder="Collection name"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateCollection();
                          }
                          if (e.key === "Escape") {
                            setShowCreateInput(false);
                            setNewCollectionName("");
                          }
                        }}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        className="h-8 shrink-0 px-3"
                        onClick={handleCreateCollection}
                        disabled={isCreatingCollection || !newCollectionName.trim()}
                      >
                        {isCreatingCollection ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          "Create"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-accent"
                      onClick={() => setShowCreateInput(true)}
                    >
                      <Plus className="size-4" />
                      Create New Collection
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* 6. Share with Client (BROKER only) */}
          {isCurrentUserBroker && (
            <Popover open={clientPopoverOpen} onOpenChange={handleClientPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <Send className="size-4" />
                  Share with Client
                </Button>
              </PopoverTrigger>
              <PopoverContent align="center" className="w-64 p-0">
                <div className="p-3 pb-2">
                  <p className="text-sm font-semibold">Send to Client</p>
                </div>
                <Separator />
                <div className="max-h-48 overflow-y-auto p-2">
                  {isLoadingClients ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : clients.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                      No clients yet. Add clients from your dashboard.
                    </p>
                  ) : (
                    clients.map((client) => {
                      const isSending = sendingToClientId === client.id;
                      return (
                        <button
                          key={client.id}
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent disabled:opacity-50"
                          onClick={() => handleShareWithClient(client.id, client.name)}
                          disabled={isSending}
                        >
                          {isSending ? (
                            <Loader2 className="size-4 shrink-0 animate-spin" />
                          ) : (
                            <Send className="size-3.5 shrink-0 text-muted-foreground" />
                          )}
                          <div className="flex flex-col items-start min-w-0">
                            <span className="truncate text-sm">{client.name}</span>
                            <span className="truncate text-xs text-muted-foreground">{client.email}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* 7. Report Link */}
          <div className="flex justify-center pt-1">
            <ReportListingDialog listingId={listing.id} />
          </div>
        </CardContent>
      </Card>

      {/* Email Dialog for sharing listings via platform */}
      <SendEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        defaultSubject={`Check out: ${listing.title} on MercatoList`}
        defaultMessage={`I found this listing on MercatoList and thought you might be interested!`}
        title="Share Listing via Email"
        description="Send this listing to someone via MercatoList"
        listing={{
          title: listing.title,
          price: listing.askingPrice ? `$${Number(listing.askingPrice).toLocaleString()}` : "Price TBD",
          category: (listing as any).category || "",
          neighborhood: (listing as any).neighborhood || "",
          borough: (listing as any).borough || "",
          photoUrl: (listing as any).photos?.[0]?.url || undefined,
          url: typeof window !== "undefined" ? window.location.href : `https://mercatolist.com/listings/${listing.slug}`,
        }}
      />
    </div>
  );
}
