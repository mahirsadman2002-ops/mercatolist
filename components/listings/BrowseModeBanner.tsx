"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  FolderOpen,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BrowseModeBannerProps {
  listingId: string;
  listingSlug: string;
}

interface OrderEntry {
  id: string;
  slug: string;
}

/**
 * Sticky banner shown on the listing detail page when the user got here from
 * the add-to-collection browse mode (?addToCollection=X in the URL).
 *
 * - Lets them select/unselect this specific listing (persists via sessionStorage)
 * - Prev/Next arrows navigate through the ordered browse list
 * - "Back to browse" returns to /listings?addToCollection=X
 * - "Add to collection" button stays in sync with the floating bar in the grid
 */
export function BrowseModeBanner({
  listingId,
  listingSlug,
}: BrowseModeBannerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToCollectionId = searchParams.get("addToCollection");

  const [collectionName, setCollectionName] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderEntry[]>([]);
  const [isSelected, setIsSelected] = useState(false);
  const [isAlreadyInCollection, setIsAlreadyInCollection] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Hydrate everything from sessionStorage on mount (or fetch if missing)
  useEffect(() => {
    if (!addToCollectionId || typeof window === "undefined") return;
    try {
      const nameKey = `browseMode:${addToCollectionId}:name`;
      const orderKey = `browseMode:${addToCollectionId}:order`;
      const selectedKey = `browseMode:${addToCollectionId}:selected`;
      const cachedName = window.sessionStorage.getItem(nameKey);
      if (cachedName) setCollectionName(cachedName);
      else {
        // Fall back to network if user landed here from an email/link
        fetch(`/api/collections/${addToCollectionId}`)
          .then((r) => r.json())
          .then((j) => {
            if (j.success) {
              setCollectionName(j.data.name);
              window.sessionStorage.setItem(nameKey, j.data.name);
              setIsAlreadyInCollection(
                (j.data.collectionListings || []).some(
                  (cl: { listing: { id: string } }) =>
                    cl.listing.id === listingId,
                ),
              );
            }
          })
          .catch(() => {});
      }
      const cachedOrder = window.sessionStorage.getItem(orderKey);
      if (cachedOrder) {
        try {
          setOrder(JSON.parse(cachedOrder));
        } catch {
          // ignore
        }
      }
      const cachedSelected = window.sessionStorage.getItem(selectedKey);
      if (cachedSelected) {
        try {
          const arr = JSON.parse(cachedSelected) as string[];
          setIsSelected(arr.includes(listingId));
        } catch {
          // ignore
        }
      }
    } catch {
      // Silent
    }
  }, [addToCollectionId, listingId]);

  function persistSelection(selected: boolean) {
    if (!addToCollectionId || typeof window === "undefined") return;
    const key = `browseMode:${addToCollectionId}:selected`;
    try {
      const raw = window.sessionStorage.getItem(key);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      const next = selected
        ? Array.from(new Set([...arr, listingId]))
        : arr.filter((id) => id !== listingId);
      window.sessionStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Silent
    }
  }

  function toggleSelected() {
    if (isAlreadyInCollection) return;
    const next = !isSelected;
    setIsSelected(next);
    persistSelection(next);
  }

  async function handleAddNow() {
    if (!addToCollectionId || isAlreadyInCollection) return;
    setIsAdding(true);
    try {
      const res = await fetch(
        `/api/collections/${addToCollectionId}/listings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId }),
        },
      );
      if (res.ok) {
        toast.success("Added to collection");
        setIsAlreadyInCollection(true);
        // Also remove from pending selection since it's now added
        persistSelection(false);
        setIsSelected(false);
      } else {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error || "Failed to add");
      }
    } catch {
      toast.error("Failed to add");
    } finally {
      setIsAdding(false);
    }
  }

  if (!addToCollectionId) return null;

  const currentIndex = order.findIndex((o) => o.slug === listingSlug);
  const prev = currentIndex > 0 ? order[currentIndex - 1] : null;
  const next =
    currentIndex >= 0 && currentIndex < order.length - 1
      ? order[currentIndex + 1]
      : null;

  function goTo(entry: OrderEntry | null) {
    if (!entry) return;
    router.push(`/listings/${entry.slug}?addToCollection=${addToCollectionId}`);
  }

  return (
    <div className="sticky top-0 z-40 border-b bg-teal-600 text-white">
      <div className="container mx-auto px-4 py-2.5 flex flex-wrap items-center gap-3">
        {/* Back to browse + collection name */}
        <Link
          href={`/listings?addToCollection=${addToCollectionId}`}
          className="flex items-center gap-2 min-w-0 hover:underline"
        >
          <FolderOpen className="h-4 w-4 shrink-0" />
          <span className="text-sm truncate">
            Back to{" "}
            <span className="font-semibold">
              {collectionName || "your collection"}
            </span>
          </span>
        </Link>

        {/* Prev / Next */}
        {order.length > 1 && currentIndex >= 0 && (
          <div className="flex items-center gap-1 ml-auto">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/15 hover:text-white h-8 px-2"
              onClick={() => goTo(prev)}
              disabled={!prev}
              aria-label="Previous listing"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs tabular-nums">
              {currentIndex + 1} / {order.length}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/15 hover:text-white h-8 px-2"
              onClick={() => goTo(next)}
              disabled={!next}
              aria-label="Next listing"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Select checkbox + Add button */}
        <div className="flex items-center gap-2 ml-auto sm:ml-2">
          {isAlreadyInCollection ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-2.5 py-1 text-xs font-medium">
              <Check className="h-3.5 w-3.5" />
              Already in collection
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleSelected}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md border-2 transition-all",
                  isSelected
                    ? "border-white bg-white text-teal-700"
                    : "border-white/70 bg-transparent text-white hover:bg-white/15",
                )}
                aria-label={isSelected ? "Unselect" : "Select"}
              >
                {isSelected && <Check className="h-4 w-4" />}
              </button>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white text-teal-700 hover:bg-white/90"
                onClick={handleAddNow}
                disabled={isAdding}
              >
                {isAdding ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add now
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
