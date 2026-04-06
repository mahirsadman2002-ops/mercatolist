import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Building2,
  FolderOpen,
  Star,
  StickyNote,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import { SharedListingInterest } from "@/components/collections/SharedListingInterest";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListingPhoto {
  url: string;
  order: number;
}

interface SharedListing {
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
  photos: ListingPhoto[];
  listedBy: {
    id: string;
    name: string;
    displayName?: string | null;
    role: string;
    brokerageName?: string | null;
  };
  createdAt: string;
}

interface SharedCollectionListing {
  id: string;
  personalRating: number | null;
  clientInterested?: boolean | null;
  addedAt: string;
  listing: SharedListing;
}

interface SharedNote {
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

interface SharedCollectionData {
  id: string;
  name: string;
  description?: string | null;
  owner: {
    id: string;
    name: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    role: string;
    brokerageName?: string | null;
  };
  listingCount: number;
  collectionListings: SharedCollectionListing[];
  notes: SharedNote[];
  createdAt: string;
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

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchSharedCollection(
  token: string
): Promise<SharedCollectionData | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://mercatolist.com";
  try {
    const res = await fetch(`${baseUrl}/api/collections/shared/${token}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success) return null;
    return json.data;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SharedCollectionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const collection = await fetchSharedCollection(token);

  if (!collection) {
    notFound();
  }

  const ownerName =
    collection.owner.displayName || collection.owner.name;

  const generalNotes = collection.notes.filter((n) => !n.listingId);
  const listingNotesMap = new Map<string, SharedNote[]>();
  collection.notes
    .filter((n) => n.listingId)
    .forEach((n) => {
      const arr = listingNotesMap.get(n.listingId!) || [];
      arr.push(n);
      listingNotesMap.set(n.listingId!, arr);
    });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <Badge variant="outline" className="text-xs">
            Shared Collection
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="text-muted-foreground max-w-2xl">
              {collection.description}
            </p>
          )}
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              {collection.owner.avatarUrl && (
                <AvatarImage src={collection.owner.avatarUrl} />
              )}
              <AvatarFallback>{initials(ownerName)}</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <span className="font-medium">{ownerName}</span>
              {collection.owner.brokerageName && (
                <span className="text-muted-foreground">
                  {" "}
                  &middot; {collection.owner.brokerageName}
                </span>
              )}
            </div>
            <Badge variant="secondary" className="text-xs">
              {collection.listingCount} listing
              {collection.listingCount !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>

        {/* Listings grid */}
        {collection.collectionListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
            <FolderOpen className="size-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              This collection is empty.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {collection.collectionListings.map((cl) => {
              const { listing, personalRating } = cl;
              const sortedPhotos = [...listing.photos].sort(
                (a, b) => a.order - b.order
              );
              const primaryPhoto = sortedPhotos[0]?.url ?? null;
              const askingPrice = toNumber(listing.askingPrice);
              const annualRevenue = toNumber(listing.annualRevenue);
              const cashFlowSDE = toNumber(listing.cashFlowSDE);
              const statusInfo = STATUS_BADGE_MAP[listing.status];

              return (
                <Link
                  key={cl.id}
                  href={`/listings/${listing.slug}`}
                  className="group block"
                >
                  <Card className="overflow-hidden border border-border/60 bg-card p-0 gap-0 transition-shadow duration-300 group-hover:shadow-lg">
                    {/* Image */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                      {primaryPhoto ? (
                        <Image
                          src={primaryPhoto}
                          alt={listing.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <Building2 className="size-10 text-muted-foreground/30" />
                        </div>
                      )}

                      <div className="absolute left-3 top-3">
                        <Badge
                          variant="secondary"
                          className="bg-white/90 text-foreground backdrop-blur-sm shadow-sm text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-md border-0"
                        >
                          {listing.category}
                        </Badge>
                      </div>

                      {statusInfo && (
                        <div className="absolute bottom-3 left-3">
                          <Badge
                            className={`${statusInfo.className} text-[11px] border-0`}
                          >
                            {statusInfo.label}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <CardContent className="p-4 sm:p-5 space-y-2">
                      <p className="text-xl font-bold">
                        {askingPrice != null
                          ? formatCurrency(askingPrice)
                          : "Price Undisclosed"}
                      </p>
                      <h3 className="text-sm font-semibold truncate">
                        {listing.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3" />
                        <span className="truncate">
                          {listing.neighborhood},{" "}
                          {formatBorough(listing.borough)}
                        </span>
                      </div>

                      <div className="h-px bg-border/70" />

                      <div className="grid grid-cols-2 gap-x-4 text-sm">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                            Revenue
                          </span>
                          <span className="font-semibold text-foreground/85">
                            {annualRevenue != null
                              ? formatCurrency(annualRevenue)
                              : "\u2014"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                            Cash Flow
                          </span>
                          <span className="font-semibold text-foreground/85">
                            {cashFlowSDE != null
                              ? formatCurrency(cashFlowSDE)
                              : "\u2014"}
                          </span>
                        </div>
                      </div>

                      {/* Rating display */}
                      {personalRating != null && personalRating > 0 && (
                        <div className="flex items-center gap-0.5 pt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`size-3.5 ${
                                s <= personalRating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Like / Dislike buttons */}
                      <SharedListingInterest
                        collectionId={collection.id}
                        listingId={listing.id}
                        initialInterest={cl.clientInterested ?? null}
                        sharedToken={token}
                      />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Notes section (read-only) */}
        {(generalNotes.length > 0 || listingNotesMap.size > 0) && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <StickyNote className="size-4" />
              Notes
            </h2>

            {generalNotes.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  General Notes
                </p>
                {generalNotes.map((note) => (
                  <div key={note.id} className="flex gap-3 text-sm">
                    <Avatar size="sm">
                      {note.user.avatarUrl && (
                        <AvatarImage src={note.user.avatarUrl} />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {initials(
                          note.user.displayName || note.user.name
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5 text-xs">
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
                  </div>
                ))}
              </div>
            )}

            {listingNotesMap.size > 0 && (
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Listing Notes
                </p>
                {Array.from(listingNotesMap.entries()).map(
                  ([listingId, notes]) => {
                    const listing =
                      collection.collectionListings.find(
                        (cl) => cl.listing.id === listingId
                      )?.listing;
                    return (
                      <div key={listingId} className="space-y-2">
                        <p className="text-sm font-medium text-primary">
                          {listing?.title || "Unknown Listing"}
                        </p>
                        {notes.map((note) => (
                          <div
                            key={note.id}
                            className="flex gap-3 text-sm ml-2"
                          >
                            <Avatar size="sm">
                              {note.user.avatarUrl && (
                                <AvatarImage src={note.user.avatarUrl} />
                              )}
                              <AvatarFallback className="text-[10px]">
                                {initials(
                                  note.user.displayName || note.user.name
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-1.5 text-xs">
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
                          </div>
                        ))}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="border-t pt-8 text-center space-y-4">
          <h2 className="text-xl font-bold">
            Join MercatoList to create your own collections
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Save listings, organize collections, compare businesses, and
            discover the best opportunities across New York City.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/listings">
              <Button variant="outline" size="lg">
                Browse Listings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
