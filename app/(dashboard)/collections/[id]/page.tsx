"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Mail,
  Share2,
  Trash2,
  Loader2,
  X,
  User,
  Phone,
  FolderOpen,
  Check,
  Star,
  Copy,
  UserPlus,
  GitCompare,
  CopyPlus,
  MapPin,
  Building2,
  StickyNote,
  ThumbsUp,
  ThumbsDown,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListingPhoto {
  url: string;
  order: number;
}

interface ListedBy {
  id: string;
  name: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  role: string;
  brokerageName?: string | null;
}

interface Listing {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  category: string;
  status: string;
  askingPrice: number | string;
  annualRevenue?: number | string | null;
  cashFlowSDE?: number | string | null;
  neighborhood: string;
  borough: string;
  address?: string | null;
  photos: ListingPhoto[];
  listedBy: ListedBy;
  yearEstablished?: number | null;
  numberOfEmployees?: number | null;
  squareFootage?: number | null;
  createdAt: string;
}

interface CollectionListing {
  id: string;
  personalRating: number | null;
  clientInterested?: boolean | null;
  addedBy?: string | null;
  addedAt: string;
  listing: Listing;
}

interface CollectionCollaborator {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    displayName?: string | null;
    email: string;
    avatarUrl?: string | null;
  };
  joinedAt: string;
}

interface CollectionNote {
  id: string;
  content: string;
  listingId?: string | null;
  user: {
    id: string;
    name: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
  createdAt: string;
}

interface ClientInfo {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

interface CollectionDetail {
  id: string;
  name: string;
  description?: string | null;
  shareToken?: string | null;
  isPubliclyShared: boolean;
  userId: string;
  client?: ClientInfo | null;
  listingCount: number;
  collectionListings: CollectionListing[];
  collaborators: CollectionCollaborator[];
  notes: CollectionNote[];
  createdAt: string;
  updatedAt: string;
}

interface CompareListingData {
  collectionListingId: string;
  personalRating: number | null;
  clientInterested?: boolean | null;
  listing: Listing & {
    netIncome?: number | string | null;
    profitMargin?: number | string | null;
    askingMultiple?: number | string | null;
    monthlyRent?: number | string | null;
    sellerFinancing?: boolean;
    sbaFinancingAvailable?: boolean;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNumber(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
}

function formatBorough(borough: string): string {
  return borough
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const STATUS_BADGE_MAP: Record<string, { label: string; className: string }> = {
  UNDER_CONTRACT: {
    label: "Under Contract",
    className: "bg-amber-500/90 text-white",
  },
  SOLD: { label: "SOLD", className: "bg-emerald-600/90 text-white" },
  OFF_MARKET: {
    label: "Off Market",
    className: "bg-slate-500/90 text-white",
  },
};

type SortKey =
  | "addedAt"
  | "priceLow"
  | "priceHigh"
  | "revenue"
  | "rating";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // Data
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inline editing
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Dialogs
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  // Email
  const [emailMessage, setEmailMessage] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Sharing
  const [isPubliclyShared, setIsPubliclyShared] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isTogglingShare, setIsTogglingShare] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [isInviting, setIsInviting] = useState(false);

  // Compare
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [compareData, setCompareData] = useState<CompareListingData[]>([]);
  const [isLoadingCompare, setIsLoadingCompare] = useState(false);

  // Sort
  const [sortBy, setSortBy] = useState<SortKey>("addedAt");

  // Notes
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Duplicate
  const [isDuplicating, setIsDuplicating] = useState(false);

  // -----------------------------------------------------------------------
  // Fetch collection
  // -----------------------------------------------------------------------
  const fetchCollection = useCallback(async () => {
    try {
      const res = await fetch(`/api/collections/${id}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success) {
        setCollection(json.data);
        setIsPubliclyShared(json.data.isPubliclyShared);
        if (json.data.isPubliclyShared && json.data.shareToken) {
          const base =
            process.env.NEXT_PUBLIC_APP_URL || "https://mercatolist.com";
          setShareUrl(`${base}/collections/shared/${json.data.shareToken}`);
        }
      }
    } catch {
      toast.error("Failed to load collection");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  // -----------------------------------------------------------------------
  // Inline edit handlers
  // -----------------------------------------------------------------------
  const handleSaveName = async () => {
    if (!editName.trim() || !collection) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/collections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!res.ok) throw new Error();
      setCollection((prev) =>
        prev ? { ...prev, name: editName.trim() } : prev
      );
      setEditingName(false);
      toast.success("Name updated");
    } catch {
      toast.error("Failed to update name");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleSaveDesc = async () => {
    if (!collection) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/collections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: editDesc.trim() || null }),
      });
      if (!res.ok) throw new Error();
      setCollection((prev) =>
        prev
          ? { ...prev, description: editDesc.trim() || null }
          : prev
      );
      setEditingDesc(false);
      toast.success("Description updated");
    } catch {
      toast.error("Failed to update description");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // -----------------------------------------------------------------------
  // Delete
  // -----------------------------------------------------------------------
  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Collection deleted");
      router.push("/collections");
    } catch {
      toast.error("Failed to delete collection");
    }
  };

  // -----------------------------------------------------------------------
  // Remove listing
  // -----------------------------------------------------------------------
  const handleRemoveListing = async (listingId: string) => {
    try {
      const res = await fetch(
        `/api/collections/${id}/listings/${listingId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      setCollection((prev) =>
        prev
          ? {
              ...prev,
              collectionListings: prev.collectionListings.filter(
                (cl) => cl.listing.id !== listingId
              ),
              listingCount: prev.listingCount - 1,
            }
          : prev
      );
      toast.success("Removed from collection");
    } catch {
      toast.error("Failed to remove listing");
    }
  };

  // -----------------------------------------------------------------------
  // Rating
  // -----------------------------------------------------------------------
  const handleRate = async (listingId: string, rating: number) => {
    try {
      const res = await fetch(
        `/api/collections/${id}/listings/${listingId}/rate`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating }),
        }
      );
      if (!res.ok) throw new Error();
      setCollection((prev) =>
        prev
          ? {
              ...prev,
              collectionListings: prev.collectionListings.map((cl) =>
                cl.listing.id === listingId
                  ? { ...cl, personalRating: rating }
                  : cl
              ),
            }
          : prev
      );
    } catch {
      toast.error("Failed to rate listing");
    }
  };

  // -----------------------------------------------------------------------
  // Email to client
  // -----------------------------------------------------------------------
  const handleEmailClient = async () => {
    setIsSendingEmail(true);
    try {
      const res = await fetch(`/api/collections/${id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalMessage: emailMessage.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send email");
      }
      toast.success(`Collection emailed to ${collection?.client?.name}!`);
      setEmailOpen(false);
      setEmailMessage("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send email"
      );
    } finally {
      setIsSendingEmail(false);
    }
  };

  // -----------------------------------------------------------------------
  // Sharing
  // -----------------------------------------------------------------------
  const handleToggleSharing = async () => {
    setIsTogglingShare(true);
    try {
      const res = await fetch(`/api/collections/${id}/share`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success) {
        setIsPubliclyShared(json.data.isPubliclyShared);
        setShareUrl(json.data.shareUrl || "");
        setCollection((prev) =>
          prev
            ? {
                ...prev,
                isPubliclyShared: json.data.isPubliclyShared,
                shareToken: json.data.shareToken,
              }
            : prev
        );
        toast.success(
          json.data.isPubliclyShared
            ? "Public sharing enabled"
            : "Public sharing disabled"
        );
      }
    } catch {
      toast.error("Failed to toggle sharing");
    } finally {
      setIsTogglingShare(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard");
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      const res = await fetch(`/api/collections/${id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to invite");
      setCollection((prev) =>
        prev
          ? {
              ...prev,
              collaborators: [...prev.collaborators, json.data],
            }
          : prev
      );
      setInviteEmail("");
      toast.success("Collaborator invited");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to invite"
      );
    } finally {
      setIsInviting(false);
    }
  };

  // -----------------------------------------------------------------------
  // Compare
  // -----------------------------------------------------------------------
  const toggleSelect = (listingId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) {
        next.delete(listingId);
      } else if (next.size < 4) {
        next.add(listingId);
      } else {
        toast.error("Maximum 4 listings can be compared");
      }
      return next;
    });
  };

  const handleCompare = async () => {
    if (selectedIds.size < 2) {
      toast.error("Select at least 2 listings to compare");
      return;
    }
    setIsLoadingCompare(true);
    try {
      const res = await fetch(`/api/collections/${id}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingIds: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success) {
        setCompareData(json.data);
        setCompareOpen(true);
      }
    } catch {
      toast.error("Failed to load comparison data");
    } finally {
      setIsLoadingCompare(false);
    }
  };

  // -----------------------------------------------------------------------
  // Duplicate
  // -----------------------------------------------------------------------
  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const res = await fetch(`/api/collections/${id}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success) {
        toast.success("Collection duplicated");
        router.push(`/collections/${json.data.id}`);
      }
    } catch {
      toast.error("Failed to duplicate collection");
    } finally {
      setIsDuplicating(false);
    }
  };

  // -----------------------------------------------------------------------
  // Notes
  // -----------------------------------------------------------------------
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsAddingNote(true);
    try {
      const res = await fetch(`/api/collections/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote.trim() }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success) {
        setCollection((prev) =>
          prev
            ? { ...prev, notes: [json.data, ...prev.notes] }
            : prev
        );
        setNewNote("");
      }
    } catch {
      toast.error("Failed to add note");
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await fetch(
        `/api/collections/${id}/notes/${noteId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      setCollection((prev) =>
        prev
          ? { ...prev, notes: prev.notes.filter((n) => n.id !== noteId) }
          : prev
      );
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  // -----------------------------------------------------------------------
  // Sorted listings
  // -----------------------------------------------------------------------
  const sortedListings = useMemo(() => {
    if (!collection) return [];
    const list = [...collection.collectionListings];
    switch (sortBy) {
      case "priceLow":
        list.sort(
          (a, b) =>
            (toNumber(a.listing.askingPrice) ?? 0) -
            (toNumber(b.listing.askingPrice) ?? 0)
        );
        break;
      case "priceHigh":
        list.sort(
          (a, b) =>
            (toNumber(b.listing.askingPrice) ?? 0) -
            (toNumber(a.listing.askingPrice) ?? 0)
        );
        break;
      case "revenue":
        list.sort(
          (a, b) =>
            (toNumber(b.listing.annualRevenue) ?? 0) -
            (toNumber(a.listing.annualRevenue) ?? 0)
        );
        break;
      case "rating":
        list.sort((a, b) => (b.personalRating ?? 0) - (a.personalRating ?? 0));
        break;
      default:
        list.sort(
          (a, b) =>
            new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        );
    }
    return list;
  }, [collection, sortBy]);

  // Group notes
  const generalNotes = useMemo(
    () => (collection?.notes || []).filter((n) => !n.listingId),
    [collection]
  );
  const listingNotes = useMemo(() => {
    const map = new Map<string, CollectionNote[]>();
    (collection?.notes || [])
      .filter((n) => n.listingId)
      .forEach((n) => {
        const arr = map.get(n.listingId!) || [];
        arr.push(n);
        map.set(n.listingId!, arr);
      });
    return map;
  }, [collection]);

  // -----------------------------------------------------------------------
  // Loading / not found
  // -----------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Collection not found</p>
        <Link href="/collections">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="size-4" /> Back to Collections
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/collections"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back to Collections
      </Link>

      {/* Header with inline editing */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 flex-1 min-w-0">
          {/* Name - click to edit */}
          {editingName ? (
            <div className="flex items-center gap-2 max-w-md">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-2xl font-bold h-auto py-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") setEditingName(false);
                }}
              />
              <Button
                size="sm"
                onClick={handleSaveName}
                disabled={isSavingEdit}
              >
                {isSavingEdit ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingName(false)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ) : (
            <h1
              className="text-2xl font-bold cursor-pointer hover:text-primary/80 transition-colors"
              onClick={() => {
                setEditName(collection.name);
                setEditingName(true);
              }}
              title="Click to edit"
            >
              {collection.name}
            </h1>
          )}

          {/* Description - click to edit */}
          {editingDesc ? (
            <div className="max-w-md space-y-2">
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Add a description..."
                rows={2}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveDesc();
                  }
                  if (e.key === "Escape") setEditingDesc(false);
                }}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveDesc}
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingDesc(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p
              className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              onClick={() => {
                setEditDesc(collection.description || "");
                setEditingDesc(true);
              }}
              title="Click to edit"
            >
              {collection.description || "Add a description..."}
            </p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="secondary">
              {collection.listingCount} listing
              {collection.listingCount !== 1 ? "s" : ""}
            </Badge>
            {collection.collaborators.length > 0 && (
              <Badge variant="secondary">
                <Users className="size-3 mr-1" />
                {collection.collaborators.length} collaborator
                {collection.collaborators.length !== 1 ? "s" : ""}
              </Badge>
            )}
            {collection.isPubliclyShared && (
              <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                Shared publicly
              </Badge>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareOpen(true)}
          >
            <Share2 className="size-3.5" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCompareMode(!compareMode);
              setSelectedIds(new Set());
            }}
          >
            <GitCompare className="size-3.5" />
            {compareMode ? "Cancel Compare" : "Compare"}
          </Button>
          {collection.client?.email && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEmailOpen(true)}
            >
              <Mail className="size-3.5" />
              Email to Client
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            disabled={isDuplicating}
          >
            {isDuplicating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CopyPlus className="size-3.5" />
            )}
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Compare floating bar */}
      {compareMode && selectedIds.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCompare}
            disabled={isLoadingCompare}
          >
            {isLoadingCompare ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <GitCompare className="size-3.5" />
            )}
            Compare {selectedIds.size} Selected
          </Button>
        </div>
      )}

      {/* Sort */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as SortKey)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="addedAt">Date Added</SelectItem>
            <SelectItem value="priceLow">Price: Low to High</SelectItem>
            <SelectItem value="priceHigh">Price: High to Low</SelectItem>
            <SelectItem value="revenue">Revenue</SelectItem>
            <SelectItem value="rating">Personal Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main content: listings + sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Listings Grid */}
        <div className="flex-1 min-w-0">
          {sortedListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
              <FolderOpen className="size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No listings in this collection yet.
              </p>
              <Link href="/listings">
                <Button variant="outline" size="sm">
                  Browse Listings
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {sortedListings.map((cl) => (
                <CollectionListingCard
                  key={cl.id}
                  collectionListing={cl}
                  compareMode={compareMode}
                  isSelected={selectedIds.has(cl.listing.id)}
                  onToggleSelect={() => toggleSelect(cl.listing.id)}
                  onRemove={() => handleRemoveListing(cl.listing.id)}
                  onRate={(rating) => handleRate(cl.listing.id, rating)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar: Notes + Collaborators + Client */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          {/* Client info */}
          {collection.client && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <User className="size-3.5" />
                  Client
                </h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{collection.client.name}</p>
                  {collection.client.email && (
                    <p className="text-muted-foreground text-xs">
                      {collection.client.email}
                    </p>
                  )}
                  {collection.client.phone && (
                    <p className="text-muted-foreground text-xs flex items-center gap-1">
                      <Phone className="size-3" />
                      {collection.client.phone}
                    </p>
                  )}
                </div>
                {/* Client interest responses */}
                {collection.collectionListings.some(
                  (cl) => cl.clientInterested != null
                ) && (
                  <div className="border-t pt-2 mt-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Interest Responses
                    </p>
                    {collection.collectionListings
                      .filter((cl) => cl.clientInterested != null)
                      .map((cl) => (
                        <div
                          key={cl.id}
                          className="flex items-center gap-2 text-xs"
                        >
                          {cl.clientInterested ? (
                            <ThumbsUp className="size-3 text-emerald-500" />
                          ) : (
                            <ThumbsDown className="size-3 text-red-500" />
                          )}
                          <span className="truncate">
                            {cl.listing.title}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Collaborators */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  Collaborators
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShareOpen(true)}
                >
                  <UserPlus className="size-3" />
                  Invite
                </Button>
              </div>
              {collection.collaborators.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No collaborators yet
                </p>
              ) : (
                <div className="space-y-2">
                  {collection.collaborators.map((collab) => (
                    <div
                      key={collab.id}
                      className="flex items-center gap-2"
                    >
                      <Avatar size="sm">
                        {collab.user.avatarUrl && (
                          <AvatarImage src={collab.user.avatarUrl} />
                        )}
                        <AvatarFallback>
                          {initials(
                            collab.user.displayName || collab.user.name
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {collab.user.displayName || collab.user.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground capitalize">
                          {collab.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <StickyNote className="size-3.5" />
                Notes
              </h3>
              {/* Add note */}
              <div className="flex gap-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  rows={2}
                  className="text-xs"
                />
              </div>
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={!newNote.trim() || isAddingNote}
                className="w-full"
              >
                {isAddingNote && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                Add Note
              </Button>

              {/* General notes */}
              {generalNotes.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    General Notes
                  </p>
                  {generalNotes.map((note) => (
                    <NoteItem
                      key={note.id}
                      note={note}
                      onDelete={() => handleDeleteNote(note.id)}
                    />
                  ))}
                </div>
              )}

              {/* Listing-specific notes */}
              {listingNotes.size > 0 && (
                <div className="space-y-3 border-t pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Listing Notes
                  </p>
                  {Array.from(listingNotes.entries()).map(
                    ([listingId, notes]) => {
                      const listing = collection.collectionListings.find(
                        (cl) => cl.listing.id === listingId
                      )?.listing;
                      return (
                        <div key={listingId} className="space-y-1.5">
                          <p className="text-xs font-medium truncate text-primary">
                            {listing?.title || "Unknown Listing"}
                          </p>
                          {notes.map((note) => (
                            <NoteItem
                              key={note.id}
                              note={note}
                              onDelete={() => handleDeleteNote(note.id)}
                            />
                          ))}
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              {generalNotes.length === 0 && listingNotes.size === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No notes yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ================================================================= */}
      {/* Dialogs                                                           */}
      {/* ================================================================= */}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &quot;{collection.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this collection. The listings
              themselves won&apos;t be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Collection to Client</DialogTitle>
            <DialogDescription>
              Send &quot;{collection.name}&quot; to{" "}
              {collection.client?.name} ({collection.client?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs text-muted-foreground mb-1">
                Preview: {collection.collectionListings.length} listings
                will be included
              </p>
              <div className="flex gap-1 flex-wrap">
                {collection.collectionListings.slice(0, 5).map((cl) => (
                  <Badge key={cl.id} variant="secondary" className="text-[10px]">
                    {cl.listing.title}
                  </Badge>
                ))}
                {collection.collectionListings.length > 5 && (
                  <Badge variant="secondary" className="text-[10px]">
                    +{collection.collectionListings.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
            <Textarea
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              placeholder="Add a personal message (optional)..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEmailClient} disabled={isSendingEmail}>
              {isSendingEmail && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Share Collection</DialogTitle>
            <DialogDescription>
              Share this collection publicly or invite collaborators.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Public sharing toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  Public Sharing
                </Label>
                <p className="text-xs text-muted-foreground">
                  Anyone with the link can view this collection
                </p>
              </div>
              <Switch
                checked={isPubliclyShared}
                onCheckedChange={handleToggleSharing}
                disabled={isTogglingShare}
              />
            </div>

            {/* Copy link */}
            {isPubliclyShared && shareUrl && (
              <div className="flex items-center gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                >
                  <Copy className="size-3.5" />
                  Copy
                </Button>
              </div>
            )}

            {/* Invite collaborator */}
            <div className="border-t pt-4 space-y-3">
              <Label className="text-sm font-medium">
                Invite Collaborator
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <Select
                  value={inviteRole}
                  onValueChange={setInviteRole}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || isInviting}
                >
                  {isInviting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compare Modal */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Compare Listings</DialogTitle>
            <DialogDescription>
              Side-by-side comparison of {compareData.length} listings
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <CompareTable data={compareData} />
          </div>
          <DialogFooter>
            <Button onClick={() => setCompareOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CollectionListingCard
// ---------------------------------------------------------------------------

function CollectionListingCard({
  collectionListing,
  compareMode,
  isSelected,
  onToggleSelect,
  onRemove,
  onRate,
}: {
  collectionListing: CollectionListing;
  compareMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
  onRate: (rating: number) => void;
}) {
  const { listing, personalRating, clientInterested } = collectionListing;
  const sortedPhotos = [...listing.photos].sort((a, b) => a.order - b.order);
  const primaryPhoto = sortedPhotos[0]?.url ?? null;
  const askingPrice = toNumber(listing.askingPrice);
  const statusInfo = STATUS_BADGE_MAP[listing.status];

  return (
    <div
      className={`relative group/card rounded-xl border transition-all ${
        isSelected
          ? "ring-2 ring-primary border-primary"
          : "border-border/60"
      }`}
    >
      {/* Compare checkbox */}
      {compareMode && (
        <div className="absolute left-3 top-3 z-20">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            className="bg-white/90 backdrop-blur-sm"
          />
        </div>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/90 text-white opacity-0 group-hover/card:opacity-100 transition-opacity backdrop-blur-sm shadow"
        title="Remove from collection"
      >
        <X className="size-3.5" />
      </button>

      {/* Client interest badge */}
      {clientInterested != null && (
        <div className="absolute right-3 top-12 z-20">
          {clientInterested ? (
            <Badge className="bg-emerald-500 text-white text-[10px] border-0">
              <ThumbsUp className="size-3 mr-0.5" />
              Interested
            </Badge>
          ) : (
            <Badge className="bg-red-500 text-white text-[10px] border-0">
              <ThumbsDown className="size-3 mr-0.5" />
              Not Interested
            </Badge>
          )}
        </div>
      )}

      <Link href={`/listings/${listing.slug}`} className="block">
        {/* Image */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-xl bg-muted">
          {primaryPhoto ? (
            <Image
              src={primaryPhoto}
              alt={listing.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Building2 className="size-10 text-muted-foreground/30" />
            </div>
          )}

          {/* Status badge */}
          {statusInfo && (
            <div className="absolute bottom-3 left-3">
              <Badge className={`${statusInfo.className} text-[11px] border-0`}>
                {statusInfo.label}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          <p className="text-lg font-bold">
            {askingPrice != null
              ? formatCurrency(askingPrice)
              : "Price Undisclosed"}
          </p>
          <h3 className="text-sm font-semibold truncate">{listing.title}</h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            <span className="truncate">
              {listing.neighborhood}, {formatBorough(listing.borough)}
            </span>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {listing.category}
          </Badge>
        </div>
      </Link>

      {/* Star rating */}
      <div className="px-4 pb-3 flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onRate(star);
            }}
            className="p-0.5 hover:scale-110 transition-transform"
            title={`Rate ${star} star${star !== 1 ? "s" : ""}`}
          >
            <Star
              className={`size-4 ${
                personalRating && star <= personalRating
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/40"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NoteItem
// ---------------------------------------------------------------------------

function NoteItem({
  note,
  onDelete,
}: {
  note: CollectionNote;
  onDelete: () => void;
}) {
  return (
    <div className="group/note flex gap-2 text-xs">
      <Avatar size="sm">
        {note.user.avatarUrl && <AvatarImage src={note.user.avatarUrl} />}
        <AvatarFallback className="text-[9px]">
          {initials(note.user.displayName || note.user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium">
            {note.user.displayName || note.user.name}
          </span>
          <span className="text-muted-foreground">
            {timeAgo(note.createdAt)}
          </span>
        </div>
        <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap">
          {note.content}
        </p>
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="opacity-0 group-hover/note:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-0.5 shrink-0"
        title="Delete note"
      >
        <Trash2 className="size-3" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CompareTable
// ---------------------------------------------------------------------------

function CompareTable({ data }: { data: CompareListingData[] }) {
  if (data.length === 0) return null;

  const num = (v: number | string | null | undefined) => toNumber(v);

  // Find best values for highlighting
  const prices = data.map((d) => num(d.listing.askingPrice)).filter(Boolean) as number[];
  const revenues = data.map((d) => num(d.listing.annualRevenue)).filter(Boolean) as number[];
  const cashFlows = data.map((d) => num(d.listing.cashFlowSDE)).filter(Boolean) as number[];

  const lowestPrice = prices.length > 0 ? Math.min(...prices) : null;
  const highestRevenue = revenues.length > 0 ? Math.max(...revenues) : null;
  const highestCashFlow = cashFlows.length > 0 ? Math.max(...cashFlows) : null;

  const highlightClass = "text-emerald-600 font-bold";

  type Row = {
    label: string;
    values: (string | React.ReactNode)[];
  };

  const rows: Row[] = [
    {
      label: "Photo",
      values: data.map((d) => {
        const photo = [...d.listing.photos].sort(
          (a, b) => a.order - b.order
        )[0]?.url;
        return photo ? (
          <div
            key={d.collectionListingId}
            className="relative w-24 h-16 rounded overflow-hidden"
          >
            <Image
              src={photo}
              alt={d.listing.title}
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
        ) : (
          <div
            key={d.collectionListingId}
            className="w-24 h-16 rounded bg-muted flex items-center justify-center"
          >
            <Building2 className="size-6 text-muted-foreground/40" />
          </div>
        );
      }),
    },
    {
      label: "Title",
      values: data.map((d) => (
        <Link
          key={d.collectionListingId}
          href={`/listings/${d.listing.slug}`}
          className="text-primary hover:underline font-medium text-xs"
        >
          {d.listing.title}
        </Link>
      )),
    },
    {
      label: "Category",
      values: data.map((d) => d.listing.category),
    },
    {
      label: "Location",
      values: data.map(
        (d) =>
          `${d.listing.neighborhood}, ${formatBorough(d.listing.borough)}`
      ),
    },
    {
      label: "Asking Price",
      values: data.map((d) => {
        const v = num(d.listing.askingPrice);
        const isLowest = v != null && v === lowestPrice;
        return (
          <span
            key={d.collectionListingId}
            className={isLowest ? highlightClass : ""}
          >
            {v != null ? formatCurrency(v) : "--"}
          </span>
        );
      }),
    },
    {
      label: "Annual Revenue",
      values: data.map((d) => {
        const v = num(d.listing.annualRevenue);
        const isHighest = v != null && v === highestRevenue;
        return (
          <span
            key={d.collectionListingId}
            className={isHighest ? highlightClass : ""}
          >
            {v != null ? formatCurrency(v) : "--"}
          </span>
        );
      }),
    },
    {
      label: "Cash Flow (SDE)",
      values: data.map((d) => {
        const v = num(d.listing.cashFlowSDE);
        const isHighest = v != null && v === highestCashFlow;
        return (
          <span
            key={d.collectionListingId}
            className={isHighest ? highlightClass : ""}
          >
            {v != null ? formatCurrency(v) : "--"}
          </span>
        );
      }),
    },
    {
      label: "Net Income",
      values: data.map((d) => {
        const v = num(d.listing.netIncome);
        return v != null ? formatCurrency(v) : "--";
      }),
    },
    {
      label: "Profit Margin",
      values: data.map((d) => {
        const v = num(d.listing.profitMargin);
        return v != null ? `${(v * 100).toFixed(1)}%` : "--";
      }),
    },
    {
      label: "Asking Multiple",
      values: data.map((d) => {
        const v = num(d.listing.askingMultiple);
        return v != null ? `${v.toFixed(1)}x` : "--";
      }),
    },
    {
      label: "Monthly Rent",
      values: data.map((d) => {
        const v = num(d.listing.monthlyRent);
        return v != null ? formatCurrency(v) : "--";
      }),
    },
    {
      label: "Employees",
      values: data.map((d) =>
        d.listing.numberOfEmployees != null
          ? String(d.listing.numberOfEmployees)
          : "--"
      ),
    },
    {
      label: "Year Established",
      values: data.map((d) =>
        d.listing.yearEstablished != null
          ? String(d.listing.yearEstablished)
          : "--"
      ),
    },
    {
      label: "Square Footage",
      values: data.map((d) =>
        d.listing.squareFootage != null
          ? `${d.listing.squareFootage.toLocaleString()} sq ft`
          : "--"
      ),
    },
    {
      label: "Seller Financing",
      values: data.map((d) =>
        d.listing.sellerFinancing ? "Yes" : "No"
      ),
    },
    {
      label: "SBA Financing",
      values: data.map((d) =>
        d.listing.sbaFinancingAvailable ? "Yes" : "No"
      ),
    },
    {
      label: "Days on Market",
      values: data.map((d) => {
        const created = new Date(d.listing.createdAt);
        const days = Math.ceil(
          (Date.now() - created.getTime()) / 86400000
        );
        return `${days}`;
      }),
    },
    {
      label: "Personal Rating",
      values: data.map((d) => (
        <div key={d.collectionListingId} className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`size-3.5 ${
                d.personalRating && s <= d.personalRating
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      )),
    },
  ];

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background z-10 min-w-[140px]">
              Metric
            </TableHead>
            {data.map((d) => (
              <TableHead key={d.collectionListingId} className="min-w-[180px]">
                {d.listing.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.label}>
              <TableCell className="sticky left-0 bg-background z-10 font-medium text-xs">
                {row.label}
              </TableCell>
              {row.values.map((val, i) => (
                <TableCell key={i} className="text-xs">
                  {val}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
