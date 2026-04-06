"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  Plus,
  Loader2,
  Search,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { CollectionCard } from "@/components/collections/CollectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface ClientInfo {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

interface CollectionData {
  id: string;
  name: string;
  description?: string | null;
  shareToken?: string | null;
  isPubliclyShared?: boolean;
  clientId?: string | null;
  client?: ClientInfo | null;
  listingCount: number;
  previewPhotos: { id?: string; url: string }[];
  collaboratorCount?: number;
  createdAt: string;
  // For shared-with-you collections
  isSharedWithMe?: boolean;
  advisorName?: string | null;
}

export default function CollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchCollections = useCallback(async () => {
    try {
      const res = await fetch("/api/collections");
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success) setCollections(json.data);
    } catch {
      toast.error("Failed to load collections");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Collection created");
      setCreateOpen(false);
      setNewName("");
      setNewDesc("");
      fetchCollections();
    } catch {
      toast.error("Failed to create collection");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/collections/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setCollections((prev) => prev.filter((c) => c.id !== deleteId));
      toast.success("Collection deleted");
    } catch {
      toast.error("Failed to delete collection");
    } finally {
      setDeleteId(null);
    }
  };

  const handleEmail = async (id: string) => {
    try {
      const res = await fetch(`/api/collections/${id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send email");
      }
      toast.success("Collection emailed to client!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email");
    }
  };

  const handleShare = async (id: string) => {
    try {
      const col = collections.find((c) => c.id === id);

      // If already publicly shared with a token, just copy the link
      if (col?.isPubliclyShared && col?.shareToken) {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://mercatolist.com";
        const link = `${baseUrl}/collections/shared/${col.shareToken}`;
        await navigator.clipboard.writeText(link);
        toast.success("Share link copied!");
        return;
      }

      // Otherwise, generate the share link first
      const res = await fetch(`/api/collections/${id}/share`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success && json.data.shareUrl) {
        await navigator.clipboard.writeText(json.data.shareUrl);
        // Update local state
        setCollections((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  isPubliclyShared: json.data.isPubliclyShared,
                  shareToken: json.data.shareToken,
                }
              : c
          )
        );
        toast.success("Share link copied!");
      } else if (json.success && !json.data.isPubliclyShared) {
        // Sharing was toggled off (it was already shared)
        // Toggle it back on and copy
        const res2 = await fetch(`/api/collections/${id}/share`, {
          method: "POST",
        });
        if (!res2.ok) throw new Error();
        const json2 = await res2.json();
        if (json2.success && json2.data.shareUrl) {
          await navigator.clipboard.writeText(json2.data.shareUrl);
          setCollections((prev) =>
            prev.map((c) =>
              c.id === id
                ? {
                    ...c,
                    isPubliclyShared: json2.data.isPubliclyShared,
                    shareToken: json2.data.shareToken,
                  }
                : c
            )
          );
          toast.success("Share link copied!");
        }
      }
    } catch {
      toast.error("Failed to generate share link");
    }
  };

  // Separate own collections from shared-with-me collections
  const myCollections = collections.filter((c) => !c.isSharedWithMe);
  const sharedWithMe = collections.filter((c) => c.isSharedWithMe);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Collections</h1>
          <p className="text-sm text-muted-foreground">
            Organize listings into collections
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Create Collection
        </Button>
      </div>

      {myCollections.length === 0 && sharedWithMe.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-20 text-center">
          <FolderOpen className="size-14 text-muted-foreground/30" />
          <div>
            <p className="text-lg font-semibold">No collections yet</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
              Collections help you organize listings. Create one while browsing!
            </p>
          </div>
          <Button onClick={() => router.push("/listings")}>
            <Search className="size-4" />
            Browse Listings
          </Button>
        </div>
      ) : (
        <>
          {/* Own collections */}
          {myCollections.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {myCollections.map((col) => (
                <CollectionCard
                  key={col.id}
                  collection={{
                    id: col.id,
                    name: col.name,
                    description: col.description,
                    clientName: col.client?.name || null,
                    clientEmail: col.client?.email || null,
                    listingCount: col.listingCount,
                    previewPhotos: col.previewPhotos,
                    collaboratorCount: col.collaboratorCount,
                    isPubliclyShared: col.isPubliclyShared,
                    createdAt: col.createdAt,
                  }}
                  onEdit={(id) => router.push(`/collections/${id}`)}
                  onDelete={setDeleteId}
                  onEmail={handleEmail}
                  onShare={handleShare}
                />
              ))}
            </div>
          )}

          {/* Shared with me collections */}
          {sharedWithMe.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <UserCheck className="size-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Shared with You</h2>
                <Badge variant="secondary" className="text-xs">
                  {sharedWithMe.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {sharedWithMe.map((col) => (
                  <div key={col.id} className="relative">
                    {col.advisorName && (
                      <div className="mb-1.5 text-xs text-muted-foreground">
                        Shared by{" "}
                        <span className="font-medium text-foreground">
                          {col.advisorName}
                        </span>
                      </div>
                    )}
                    <CollectionCard
                      collection={{
                        id: col.id,
                        name: col.name,
                        description: col.description,
                        clientName: null,
                        clientEmail: null,
                        listingCount: col.listingCount,
                        previewPhotos: col.previewPhotos,
                        collaboratorCount: col.collaboratorCount,
                        isPubliclyShared: col.isPubliclyShared,
                        createdAt: col.createdAt,
                      }}
                      onEdit={(id) => router.push(`/collections/${id}`)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
            <DialogDescription>
              Give your collection a name and optional description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="My Collection"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="What's this collection for?"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || isCreating}
            >
              {isCreating && <Loader2 className="size-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection?</AlertDialogTitle>
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
    </div>
  );
}
