"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Loader2,
  Search,
  Trash2,
  FolderPlus,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";

import { ListingCard } from "@/components/listings/ListingCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AddToCollectionDropdown } from "@/components/collections/AddToCollectionDropdown";

interface SavedListingData {
  id: string;
  createdAt: string;
  listing: {
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
  };
}

export default function SavedListingsPage() {
  const router = useRouter();
  const [savedListings, setSavedListings] = useState<SavedListingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState("savedAt");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRemoving, setIsRemoving] = useState(false);

  const fetchSaved = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/user/saved-listings?sort=${sort}&status=${statusFilter}`
      );
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success) {
        setSavedListings(json.data);
      }
    } catch {
      toast.error("Failed to load saved listings");
    } finally {
      setIsLoading(false);
    }
  }, [sort, statusFilter]);

  useEffect(() => {
    setIsLoading(true);
    fetchSaved();
  }, [fetchSaved]);

  const toggleSelect = (listingId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) next.delete(listingId);
      else next.add(listingId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === savedListings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(savedListings.map((s) => s.listing.id)));
    }
  };

  const handleBulkRemove = async () => {
    if (selectedIds.size === 0) return;
    setIsRemoving(true);
    try {
      const res = await fetch("/api/user/saved-listings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingIds: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error();
      setSavedListings((prev) =>
        prev.filter((s) => !selectedIds.has(s.listing.id))
      );
      toast.success(`Removed ${selectedIds.size} listing(s) from saves`);
      setSelectedIds(new Set());
    } catch {
      toast.error("Failed to remove listings");
    } finally {
      setIsRemoving(false);
    }
  };

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
      <div>
        <h1 className="text-2xl font-bold">Saved Listings</h1>
        <p className="text-sm text-muted-foreground">
          {savedListings.length} saved listing{savedListings.length !== 1 ? "s" : ""}
        </p>
      </div>

      {savedListings.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-20 text-center">
          <Heart className="size-14 text-muted-foreground/30" />
          <div>
            <p className="text-lg font-semibold">
              You haven&apos;t saved any listings yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
              Browse businesses and tap the heart icon to save listings
              you&apos;re interested in.
            </p>
          </div>
          <Button onClick={() => router.push("/listings")}>
            <Search className="size-4" />
            Browse Listings
          </Button>
        </div>
      ) : (
        <>
          {/* Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Status filter */}
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                  <TabsTrigger value="ALL">All</TabsTrigger>
                  <TabsTrigger value="ACTIVE">Active</TabsTrigger>
                  <TabsTrigger value="UNDER_CONTRACT">Under Contract</TabsTrigger>
                  <TabsTrigger value="SOLD">Sold</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-2">
              {/* Sort */}
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="size-3.5 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savedAt">Date Saved</SelectItem>
                  <SelectItem value="priceAsc">Price: Low to High</SelectItem>
                  <SelectItem value="priceDesc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-3 border-b pb-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  selectedIds.size === savedListings.length &&
                  savedListings.length > 0
                }
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedIds.size > 0
                  ? `${selectedIds.size} selected`
                  : "Select All"}
              </span>
            </div>

            {selectedIds.size > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkRemove}
                  disabled={isRemoving}
                >
                  {isRemoving ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  Remove Selected
                </Button>
                <AddToCollectionDropdown
                  listingIds={Array.from(selectedIds)}
                  trigger={
                    <Button variant="outline" size="sm">
                      <FolderPlus className="size-3.5" />
                      Add to Collection
                    </Button>
                  }
                  onDone={() => {
                    setSelectedIds(new Set());
                    toast.success("Added to collection");
                  }}
                />
              </>
            )}
          </div>

          {/* Listing Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {savedListings.map((saved) => (
              <div key={saved.id} className="relative">
                {selectedIds.size > 0 && (
                  <div className="absolute top-4 left-4 z-20">
                    <Checkbox
                      checked={selectedIds.has(saved.listing.id)}
                      onCheckedChange={() => toggleSelect(saved.listing.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white/90 backdrop-blur-sm"
                    />
                  </div>
                )}
                <ListingCard
                  listing={saved.listing}
                  isSaved={true}
                  savedAt={saved.createdAt}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
