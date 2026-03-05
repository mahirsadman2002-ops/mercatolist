"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FolderPlus,
  Search,
  Plus,
  Check,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface Collection {
  id: string;
  name: string;
  _count?: { listings: number };
  listings?: { id: string }[];
}

interface AddToCollectionDropdownProps {
  listingId?: string;
  listingIds?: string[];
  trigger?: React.ReactNode;
  onDone?: () => void;
}

export function AddToCollectionDropdown({
  listingId,
  listingIds,
  trigger,
  onDone,
}: AddToCollectionDropdownProps) {
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const ids = listingIds || (listingId ? [listingId] : []);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/collections");
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) setCollections(json.data);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchCollections();
  }, [open, fetchCollections]);

  const isInCollection = (col: Collection) => {
    if (!col.listings) return false;
    return ids.some((id) => col.listings!.some((l) => l.id === id));
  };

  const handleToggle = async (collectionId: string, isCurrentlyIn: boolean) => {
    setTogglingId(collectionId);
    try {
      if (isCurrentlyIn && ids.length === 1) {
        // Remove from collection
        await fetch(
          `/api/collections/${collectionId}/listings/${ids[0]}`,
          { method: "DELETE" }
        );
      } else {
        // Add to collection (each listing)
        for (const id of ids) {
          await fetch(`/api/collections/${collectionId}/listings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listingId: id }),
          });
        }
      }
      await fetchCollections();
    } catch {
      toast.error("Failed to update collection");
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          listingId: ids[0],
        }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();

      // Add remaining listings if bulk
      if (ids.length > 1 && json.data?.id) {
        for (let i = 1; i < ids.length; i++) {
          await fetch(`/api/collections/${json.data.id}/listings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listingId: ids[i] }),
          });
        }
      }

      toast.success(`Created "${newName.trim()}"`);
      setNewName("");
      setShowCreate(false);
      await fetchCollections();
      onDone?.();
    } catch {
      toast.error("Failed to create collection");
    } finally {
      setCreating(false);
    }
  };

  const filtered = collections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FolderPlus className="size-4" />
            Add to Collection
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        {/* Search */}
        <div className="border-b px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search collections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        {/* Collections List */}
        <div className="max-h-48 overflow-y-auto py-1">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              {search ? "No matching collections" : "No collections yet"}
            </p>
          ) : (
            filtered.map((col) => {
              const isIn = isInCollection(col);
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => handleToggle(col.id, isIn)}
                  disabled={togglingId === col.id}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  <Checkbox checked={isIn} className="pointer-events-none" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{col.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {col._count?.listings ?? 0} listing
                      {(col._count?.listings ?? 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {togglingId === col.id && (
                    <Loader2 className="size-3.5 animate-spin" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Create New */}
        <div className="border-t">
          {showCreate ? (
            <div className="space-y-2 p-3">
              <Label className="text-xs">Collection name</Label>
              <div className="flex gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="My Collection"
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  className="h-8 px-3"
                >
                  {creating ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowCreate(false)}
                  className="h-8 px-2"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-primary hover:bg-muted/50 transition-colors"
            >
              <Plus className="size-4" />
              Create New Collection
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
