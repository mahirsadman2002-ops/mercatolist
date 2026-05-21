"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
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
  Briefcase,
  Info,
  Plus,
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
  assignedClients?: ClientInfo[];
  listingCount: number;
  collectionListings: CollectionListing[];
  collaborators: CollectionCollaborator[];
  notes: CollectionNote[];
  createdAt: string;
  updatedAt: string;
  isAssignedClient?: boolean;
  advisorName?: string | null;
}

interface ClientRecord {
  id: string;
  name: string;
  email?: string | null;
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
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role;
  const isBroker = userRole === "BROKER";

  // Data
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Client assignment (broker only)
  const [brokerClients, setBrokerClients] = useState<ClientRecord[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isAssigningClient, setIsAssigningClient] = useState(false);
  // Inline "Add new client" mini-form state inside the share dialog
  const [showAddClientInline, setShowAddClientInline] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  // Inline editing
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Dialogs
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

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

  // Mark all current notes as read for this user once the page loads.
  // Server tracks per-user lastNotesReadAt so unread badges clear correctly.
  useEffect(() => {
    if (!id) return;
    fetch(`/api/collections/${id}/notes/mark-read`, {
      method: "POST",
    }).catch(() => {
      // Silent — not critical to the page render.
    });
  }, [id]);

  // Pending access requests (owner sees a banner + can approve/deny inline)
  const [pendingRequests, setPendingRequests] = useState<
    {
      id: string;
      user: { id: string; name: string; displayName: string | null; email: string };
      requestedAt: string;
    }[]
  >([]);
  const [decidingRequestId, setDecidingRequestId] = useState<string | null>(
    null,
  );

  const fetchPendingRequests = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/collections/${id}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.pendingAccessRequests)) {
        setPendingRequests(json.data.pendingAccessRequests);
      }
    } catch {
      // Silent
    }
  }, [id]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  async function decideRequest(
    requestId: string,
    decision: "APPROVED" | "DENIED",
  ) {
    setDecidingRequestId(requestId);
    try {
      const res = await fetch(
        `/api/collections/${id}/access-requests/${requestId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision }),
        },
      );
      const json = await res.json();
      if (res.ok) {
        toast.success(
          decision === "APPROVED"
            ? "Access approved"
            : "Request denied",
        );
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        toast.error(json.error || "Failed to update request");
      }
    } catch {
      toast.error("Failed to update request");
    } finally {
      setDecidingRequestId(null);
    }
  }

  // Fetch broker clients when user is a broker
  useEffect(() => {
    if (!isBroker) return;
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/clients");
        if (!res.ok) return;
        const json = await res.json();
        if (json.success) {
          setBrokerClients(json.data.map((c: { id: string; name: string; email?: string | null }) => ({
            id: c.id,
            name: c.name,
            email: c.email,
          })));
        }
      } catch {
        // silent fail
      }
    };
    fetchClients();
  }, [isBroker]);

  // Sync selectedClientId when collection loads
  useEffect(() => {
    if (collection?.client?.id) {
      setSelectedClientId(collection.client.id);
    } else {
      setSelectedClientId(null);
    }
  }, [collection?.client?.id]);

  // Handle assigning/unassigning a client to this collection (broker only).
  // Uses the new CollectionClient join endpoints which auto-link matching
  // user accounts as editor collaborators and email signup invites otherwise.
  const handleToggleClientAssignment = async (
    clientId: string,
    currentlyAssigned: boolean,
  ) => {
    setIsAssigningClient(true);
    try {
      const res = await fetch(
        `/api/collections/${id}/clients/${clientId}`,
        {
          method: currentlyAssigned ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed");
      }
      // Refresh collection to pull updated assignedClients list.
      await fetchCollection();
      if (currentlyAssigned) {
        toast.success("Client unassigned");
      } else {
        toast.success(json.data?.message || "Client assigned");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign client",
      );
    } finally {
      setIsAssigningClient(false);
    }

    // Legacy: kept as a no-op for the trailing brace below
    return;
  };

  // Revoke a collaborator's access (owner only — server enforces).
  const handleRemoveCollaborator = async (userId: string) => {
    try {
      const res = await fetch(
        `/api/collections/${id}/collaborators/${userId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to revoke access");
      }
      toast.success("Access revoked");
      await fetchCollection();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to revoke access",
      );
    }
  };

  // Inline create + assign client from inside the Share dialog.
  // Creates the client via /api/clients (which auto-sends the appropriate
  // invite/heads-up email) and then assigns to this collection.
  const handleCreateAndAssignClient = async () => {
    const name = newClientName.trim();
    const email = newClientEmail.trim().toLowerCase();
    if (!name || !email) return;
    setIsCreatingClient(true);
    try {
      const createRes = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const createJson = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createJson.error || "Couldn't create client");
      }
      const newClient = createJson.data;
      // Re-fetch broker clients so the picker shows them.
      try {
        const listRes = await fetch("/api/clients");
        if (listRes.ok) {
          const listJson = await listRes.json();
          if (listJson.success) {
            setBrokerClients(
              listJson.data.map(
                (c: { id: string; name: string; email?: string | null }) => ({
                  id: c.id,
                  name: c.name,
                  email: c.email,
                }),
              ),
            );
          }
        }
      } catch {
        // Silent; the next render will fetch as needed.
      }
      // Assign immediately.
      await handleToggleClientAssignment(newClient.id, false);
      setShowAddClientInline(false);
      setNewClientName("");
      setNewClientEmail("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't create client",
      );
    } finally {
      setIsCreatingClient(false);
    }
  };

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

  // Determine if user is viewing as an assigned client
  const isAssignedClient = collection?.isAssignedClient === true;
  const advisorName = collection?.advisorName;

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

      {/* Pending access requests (owner only) */}
      {pendingRequests.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Info className="size-5 text-amber-700 shrink-0" />
            <p className="text-sm font-semibold text-amber-900">
              {pendingRequests.length} pending{" "}
              {pendingRequests.length === 1 ? "request" : "requests"} for
              access
            </p>
          </div>
          <ul className="space-y-2">
            {pendingRequests.map((req) => (
              <li
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white px-3 py-2 border border-amber-200"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {req.user.displayName || req.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {req.user.email}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => decideRequest(req.id, "APPROVED")}
                    disabled={decidingRequestId === req.id}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => decideRequest(req.id, "DENIED")}
                    disabled={decidingRequestId === req.id}
                  >
                    Deny
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Assigned client banner */}
      {isAssignedClient && advisorName && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <Info className="size-5 text-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Shared with you by {advisorName}
            </p>
            <p className="text-xs text-blue-700">
              You can view listings, mark your interest, and leave notes. Only the advisor can add or remove listings.
            </p>
          </div>
        </div>
      )}

      {/* Header with inline editing */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 flex-1 min-w-0">
          {/* Name - click to edit (not for assigned clients) */}
          {editingName && !isAssignedClient ? (
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
              className={`text-2xl font-bold ${!isAssignedClient ? "cursor-pointer hover:text-primary/80" : ""} transition-colors`}
              onClick={() => {
                if (!isAssignedClient) {
                  setEditName(collection.name);
                  setEditingName(true);
                }
              }}
              title={isAssignedClient ? undefined : "Click to edit"}
            >
              {collection.name}
            </h1>
          )}

          {/* Description - click to edit (not for assigned clients) */}
          {editingDesc && !isAssignedClient ? (
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
              className={`text-sm text-muted-foreground ${!isAssignedClient ? "cursor-pointer hover:text-foreground" : ""} transition-colors`}
              onClick={() => {
                if (!isAssignedClient) {
                  setEditDesc(collection.description || "");
                  setEditingDesc(true);
                }
              }}
              title={isAssignedClient ? undefined : "Click to edit"}
            >
              {collection.description || (isAssignedClient ? "No description" : "Add a description...")}
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
                {collection.collaborators.length} {isBroker ? "collaborator" : "collaborator"}
                {collection.collaborators.length !== 1 ? "s" : ""}
              </Badge>
            )}
            {isBroker && collection.client && (
              <Badge variant="secondary">
                <Briefcase className="size-3 mr-1" />
                Client: {collection.client.name}
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
          {!isAssignedClient && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="size-3.5" />
              Share
            </Button>
          )}
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
          {/* "Email to Client" removed — the Share dialog covers this flow via the
              collaborator invite + client assignment paths. Sharing a collection
              with a client triggers an email automatically when they don't yet
              have an account. */}
          {!isAssignedClient && (
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
          )}
          {!isAssignedClient && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          )}
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
            <SelectItem value="rating">Highest Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Participants strip — clients (broker view) + collaborators with a single
          Manage button that opens the existing share dialog. Moved here from the
          right sidebar so it lives at the top of the page where it belongs. */}
      {!isAssignedClient && (
        <Card>
          <CardContent className="p-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* Clients (broker only) — multi-client display */}
            {isBroker && (
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <Briefcase className="size-4 text-muted-foreground shrink-0" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Clients
                </span>
                {(() => {
                  const assigned = collection.assignedClients || [];
                  // Legacy single-client field fallback
                  if (assigned.length === 0 && collection.client) {
                    return (
                      <div className="flex items-center gap-1.5">
                        <Avatar size="sm">
                          <AvatarFallback className="text-[10px]">
                            {initials(collection.client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs truncate max-w-[140px]">
                          {collection.client.name}
                        </span>
                      </div>
                    );
                  }
                  if (assigned.length === 0) {
                    return (
                      <span className="text-xs text-muted-foreground italic">
                        None assigned
                      </span>
                    );
                  }
                  return (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {assigned.slice(0, 4).map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5"
                          title={c.email || c.name}
                        >
                          <Avatar size="sm" className="h-5 w-5">
                            <AvatarFallback className="text-[9px]">
                              {initials(c.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs truncate max-w-[100px]">
                            {c.name}
                          </span>
                        </div>
                      ))}
                      {assigned.length > 4 && (
                        <span className="text-xs text-muted-foreground">
                          +{assigned.length - 4} more
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Collaborators (everyone) */}
            <div className="flex items-center gap-2 min-w-0">
              <Users className="size-4 text-muted-foreground shrink-0" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Collaborators
              </span>
              {collection.collaborators.length === 0 ? (
                <span className="text-xs text-muted-foreground italic">
                  Just you
                </span>
              ) : (
                <div className="flex items-center -space-x-2">
                  {collection.collaborators.slice(0, 5).map((collab) => (
                    <Avatar
                      key={collab.id}
                      size="sm"
                      className="ring-2 ring-background"
                    >
                      {collab.user.avatarUrl && (
                        <AvatarImage src={collab.user.avatarUrl} />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {initials(
                          collab.user.displayName || collab.user.name,
                        )}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {collection.collaborators.length > 5 && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-background">
                      +{collection.collaborators.length - 5}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Manage button — opens the existing share dialog where the user can
                assign/unassign clients and invite/remove collaborators. */}
            <Button
              size="sm"
              variant="outline"
              className="ml-auto"
              onClick={() => setShareOpen(true)}
            >
              <UserPlus className="mr-1.5 size-3.5" />
              Manage
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main content: listings + sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Listings Grid */}
        <div className="flex-1 min-w-0">
          {/* "Add Listings" header — visible whenever the collection has any listings,
              or is empty (in the empty state below). Routes the user to browse mode. */}
          {sortedListings.length > 0 && (
            <div className="mb-4 flex justify-end">
              <Link href={`/listings?addToCollection=${id}`}>
                <Button size="sm">
                  <Plus className="mr-1.5 size-3.5" />
                  Add Listings
                </Button>
              </Link>
            </div>
          )}
          {sortedListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
              <FolderOpen className="size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No listings in this collection yet.
              </p>
              <Link href={`/listings?addToCollection=${id}`}>
                <Button variant="default" size="sm">
                  <Plus className="mr-1.5 size-3.5" />
                  Add Listings
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {sortedListings.map((cl, index) => (
                <CollectionListingCard
                  key={cl.id}
                  collectionListing={cl}
                  compareMode={compareMode}
                  isSelected={selectedIds.has(cl.listing.id)}
                  onToggleSelect={() => toggleSelect(cl.listing.id)}
                  onRemove={() => handleRemoveListing(cl.listing.id)}
                  onRate={(rating) => handleRate(cl.listing.id, rating)}
                  collectionId={id}
                  position={index + 1}
                  totalListings={sortedListings.length}
                  readOnly={isAssignedClient}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar: Notes only.
            Client and Collaborator cards moved to the participants strip at
            the top of the page. */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          {/* Client info, Shared-with-Clients, and Collaborators cards
              are now in the participants strip at the top of the page.
              Notes section below is the only remaining sidebar content. */}
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

      {/* Email-Client dialog removed — the Share dialog (with multi-client
          assignment) handles this flow; emails are sent automatically when a
          client is assigned and is/isn't on the platform yet. */}

      {/* Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isBroker ? "Share & Assign Collection" : "Share Collection"}
            </DialogTitle>
            <DialogDescription>
              {isBroker
                ? "Share this collection publicly, invite collaborators, or assign to a client."
                : "Share this collection publicly or invite collaborators."}
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

            {/* Assign to Clients (Broker only) — multi-select */}
            {isBroker && (
              <div className="border-t pt-4 space-y-3">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Briefcase className="size-3.5" />
                  Assign to Clients
                </Label>
                <p className="text-xs text-muted-foreground">
                  Each assigned client sees this collection on their MercatoList
                  dashboard (we email a sign-up invite if they don&apos;t have
                  an account yet).
                </p>

                {/* Currently-assigned clients with X to remove */}
                {(collection.assignedClients || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {(collection.assignedClients || []).map((c) => (
                      <Badge
                        key={c.id}
                        variant="secondary"
                        className="gap-1 pr-1 font-normal"
                      >
                        {c.name}
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleClientAssignment(c.id, true)
                          }
                          className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
                          disabled={isAssigningClient}
                          aria-label={`Remove ${c.name}`}
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Picker showing unassigned clients */}
                {(() => {
                  const assignedIds = new Set(
                    (collection.assignedClients || []).map((c) => c.id),
                  );
                  const available = brokerClients.filter(
                    (c) => !assignedIds.has(c.id),
                  );

                  if (brokerClients.length === 0 && !showAddClientInline) {
                    return (
                      <div className="flex items-center justify-between gap-3 rounded-md border border-dashed p-3">
                        <p className="text-xs text-muted-foreground">
                          No clients yet.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddClientInline(true)}
                        >
                          <UserPlus className="mr-1.5 size-3.5" />
                          Add client
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <>
                      {available.length > 0 && (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {available.map((client) => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() =>
                                handleToggleClientAssignment(
                                  client.id,
                                  false,
                                )
                              }
                              disabled={isAssigningClient}
                              className="w-full flex items-center gap-3 rounded-md border p-2 text-left transition-colors hover:border-primary hover:bg-primary/5"
                            >
                              <UserPlus className="size-3.5 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {client.name}
                                </p>
                                {client.email && (
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {client.email}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {!showAddClientInline ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAddClientInline(true)}
                          className="text-xs"
                        >
                          <Plus className="mr-1 size-3" />
                          Add a new client
                        </Button>
                      ) : (
                        <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                          <p className="text-xs font-medium">
                            Add new client
                          </p>
                          <Input
                            placeholder="Name"
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                            className="text-xs h-8"
                          />
                          <Input
                            placeholder="Email"
                            type="email"
                            value={newClientEmail}
                            onChange={(e) =>
                              setNewClientEmail(e.target.value)
                            }
                            className="text-xs h-8"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={handleCreateAndAssignClient}
                              disabled={
                                !newClientName.trim() ||
                                !newClientEmail.trim() ||
                                isCreatingClient
                              }
                            >
                              {isCreatingClient ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                "Create & assign"
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowAddClientInline(false);
                                setNewClientName("");
                                setNewClientEmail("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            They&apos;ll receive a sign-up invite if they
                            don&apos;t already have a MercatoList account.
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Invite collaborator (non-brokers only).
                Brokers share via clients + public link; anyone they want to
                share with outside their client list just gets the public link
                and signs up to request collaboration. */}
            {!isBroker && (
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
            )}

            {/* Also shared with — existing collaborators with revoke buttons.
                Useful for both brokers (people who joined via the public link
                + access request) and non-brokers (people they directly invited). */}
            {collection.collaborators.length > 0 && (
              <div className="border-t pt-4 space-y-2">
                <Label className="text-sm font-medium">
                  {isBroker ? "Also shared with" : "Shared with"}
                </Label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {collection.collaborators.map((collab) => (
                    <div
                      key={collab.id}
                      className="flex items-center gap-2 rounded-md border p-2"
                    >
                      <Avatar size="sm" className="h-7 w-7">
                        {collab.user.avatarUrl && (
                          <AvatarImage src={collab.user.avatarUrl} />
                        )}
                        <AvatarFallback className="text-[10px]">
                          {initials(
                            collab.user.displayName || collab.user.name,
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {collab.user.displayName || collab.user.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {collab.user.email}{" "}
                          <span className="capitalize">· {collab.role}</span>
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                        title="Revoke access"
                        onClick={() => handleRemoveCollaborator(collab.user.id)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
  collectionId,
  position,
  totalListings,
  readOnly = false,
}: {
  collectionListing: CollectionListing;
  compareMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
  onRate: (rating: number) => void;
  collectionId: string;
  position: number;
  totalListings: number;
  readOnly?: boolean;
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

      {/* Remove button (hidden for read-only / assigned client view) */}
      {!readOnly && (
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
      )}

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

      <Link href={`/listings/${listing.slug}?collectionId=${collectionId}&position=${position}&total=${totalListings}`} className="block">
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
