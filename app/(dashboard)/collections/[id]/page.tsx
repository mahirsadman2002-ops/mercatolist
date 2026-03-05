"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Share2,
  Pencil,
  Trash2,
  Loader2,
  X,
  User,
  Phone,
  FolderOpen,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { ListingCard } from "@/components/listings/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

interface CollectionListing {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  askingPrice: number | string;
  annualRevenue?: number | string | null;
  cashFlowSDE?: number | string | null;
  neighborhood: string;
  borough: string;
  createdAt: string;
  viewCount: number;
  saveCount: number;
  isGhostListing: boolean;
  photos: { url: string; order: number }[];
  listedBy: {
    name: string;
    displayName?: string | null;
    role: string;
    brokerageName?: string | null;
  };
}

interface CollectionDetail {
  id: string;
  name: string;
  description?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  listings: CollectionListing[];
  createdAt: string;
}

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const fetchCollection = useCallback(async () => {
    try {
      const res = await fetch(`/api/collections/${id}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success) setCollection(json.data);
    } catch {
      toast.error("Failed to load collection");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/collections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      setCollection((prev) =>
        prev ? { ...prev, name: editName.trim(), description: editDesc.trim() || null } : prev
      );
      setIsEditing(false);
      toast.success("Collection updated");
    } catch {
      toast.error("Failed to update collection");
    } finally {
      setIsSaving(false);
    }
  };

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

  const handleRemoveListing = async (listingId: string) => {
    try {
      const res = await fetch(`/api/collections/${id}/listings/${listingId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setCollection((prev) =>
        prev
          ? { ...prev, listings: prev.listings.filter((l) => l.id !== listingId) }
          : prev
      );
      toast.success("Removed from collection");
    } catch {
      toast.error("Failed to remove listing");
    }
  };

  const handleEmailClient = async () => {
    setIsSendingEmail(true);
    try {
      const res = await fetch(`/api/collections/${id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personalMessage: emailMessage.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send email");
      }
      toast.success(`Collection emailed to ${collection?.clientName}!`);
      setEmailOpen(false);
      setEmailMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setIsSendingEmail(false);
    }
  };

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

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          {isEditing ? (
            <div className="space-y-2 max-w-md">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-lg font-bold"
              />
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{collection.name}</h1>
              {collection.description && (
                <p className="text-sm text-muted-foreground">
                  {collection.description}
                </p>
              )}
            </>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="secondary">
              {collection.listings.length} listing
              {collection.listings.length !== 1 ? "s" : ""}
            </Badge>

            {collection.clientName && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="size-3" />
                <span>{collection.clientName}</span>
                {collection.clientEmail && (
                  <>
                    <span className="text-border">|</span>
                    <span>{collection.clientEmail}</span>
                  </>
                )}
                {collection.clientPhone && (
                  <>
                    <span className="text-border">|</span>
                    <Phone className="size-3" />
                    <span>{collection.clientPhone}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {collection.clientEmail && (
            <Button variant="outline" size="sm" onClick={() => setEmailOpen(true)}>
              <Mail className="size-3.5" />
              Email to Client
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditName(collection.name);
              setEditDesc(collection.description || "");
              setIsEditing(true);
            }}
          >
            <Pencil className="size-3.5" />
            Edit
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

      {/* Listings Grid */}
      {collection.listings.length === 0 ? (
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {collection.listings.map((listing) => (
            <div key={listing.id} className="relative group/card">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRemoveListing(listing.id);
                }}
                className="absolute right-3 top-14 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/90 text-white opacity-0 group-hover/card:opacity-100 transition-opacity backdrop-blur-sm shadow"
                title="Remove from collection"
              >
                <X className="size-3.5" />
              </button>
              <ListingCard listing={listing} />
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{collection.name}&quot;?</AlertDialogTitle>
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
              Send &quot;{collection.name}&quot; to {collection.clientName} ({collection.clientEmail})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
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
              {isSendingEmail && <Loader2 className="size-4 animate-spin" />}
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
