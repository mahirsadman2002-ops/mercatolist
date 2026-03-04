"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, Clock, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, calculateDaysOnMarket } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListingCardProps {
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
    createdAt: string | Date;
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
  isSaved?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, string> = {
  UNDER_CONTRACT:
    "bg-amber-500/90 text-white border-amber-600",
  SOLD: "bg-emerald-600/90 text-white border-emerald-700",
  OFF_MARKET:
    "bg-slate-500/90 text-white border-slate-600",
};

const STATUS_LABELS: Record<string, string> = {
  UNDER_CONTRACT: "Under Contract",
  SOLD: "Sold",
  OFF_MARKET: "Off Market",
};

function formatBorough(borough: string): string {
  return borough
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ListingCard({ listing, isSaved = false }: ListingCardProps) {
  const [saved, setSaved] = useState(isSaved);
  const [saving, setSaving] = useState(false);

  // Resolve primary photo (lowest order number, fallback to first, then placeholder)
  const sortedPhotos = [...listing.photos].sort((a, b) => a.order - b.order);
  const primaryPhoto = sortedPhotos[0]?.url ?? null;

  // Numeric conversions
  const askingPrice = toNumber(listing.askingPrice);
  const annualRevenue = toNumber(listing.annualRevenue);
  const cashFlowSDE = toNumber(listing.cashFlowSDE);

  // Days on market
  const daysOnMarket = calculateDaysOnMarket(
    typeof listing.createdAt === "string"
      ? new Date(listing.createdAt)
      : listing.createdAt
  );

  // Save handler
  const handleSave = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (saving) return;
      setSaving(true);

      try {
        const res = await fetch(`/api/listings/${listing.id}/save`, {
          method: "POST",
        });

        if (res.ok) {
          setSaved((prev) => !prev);
        }
      } catch {
        // Silently fail -- toast could be wired in at integration time
      } finally {
        setSaving(false);
      }
    },
    [listing.id, saving]
  );

  // Broker / lister display name
  const listerName =
    listing.listedBy.displayName || listing.listedBy.name;
  const brokerageSuffix =
    listing.listedBy.role === "BROKER" && listing.listedBy.brokerageName
      ? ` \u00B7 ${listing.listedBy.brokerageName}`
      : "";

  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
    >
      <Card className="overflow-hidden border border-border/60 bg-card p-0 gap-0 transition-shadow duration-300 ease-out group-hover:shadow-lg group-hover:shadow-black/8">
        {/* ----------------------------------------------------------------- */}
        {/* Image Area — 16:10 aspect ratio                                   */}
        {/* ----------------------------------------------------------------- */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          {primaryPhoto ? (
            <Image
              src={primaryPhoto}
              alt={listing.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Building2
                className="h-12 w-12 text-muted-foreground/40"
                strokeWidth={1.25}
              />
            </div>
          )}

          {/* Gradient overlay for readability of badges on image */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Top-left: Category badge */}
          <div className="absolute left-3 top-3">
            <Badge
              variant="secondary"
              className="bg-white/90 text-foreground backdrop-blur-sm shadow-sm text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-md border-0"
            >
              {listing.category}
            </Badge>
          </div>

          {/* Top-right: Save / heart button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            aria-label={saved ? "Unsave listing" : "Save listing"}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-200 hover:bg-white hover:scale-110 active:scale-95 disabled:opacity-50"
          >
            <Heart
              className={`h-[18px] w-[18px] transition-colors duration-200 ${
                saved
                  ? "fill-red-500 text-red-500"
                  : "fill-transparent text-slate-600"
              }`}
              strokeWidth={2}
            />
          </button>

          {/* Bottom-left: Status badge (non-ACTIVE only) */}
          {listing.status !== "ACTIVE" &&
            STATUS_LABELS[listing.status] && (
              <div className="absolute bottom-3 left-3">
                <Badge
                  className={`${STATUS_STYLES[listing.status]} text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-md border`}
                >
                  {STATUS_LABELS[listing.status]}
                </Badge>
              </div>
            )}

          {/* Bottom-right: Photo count (if more than 1) */}
          {listing.photos.length > 1 && (
            <div className="absolute bottom-3 right-3">
              <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                {listing.photos.length} photos
              </span>
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Content Area                                                      */}
        {/* ----------------------------------------------------------------- */}
        <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
          {/* Asking Price */}
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {askingPrice != null
                ? formatCurrency(askingPrice)
                : "Price Undisclosed"}
            </span>
          </div>

          {/* Title */}
          <h3 className="line-clamp-1 text-[15px] font-semibold leading-snug text-foreground/90 group-hover:text-foreground transition-colors duration-200">
            {listing.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            <span className="truncate">
              {listing.neighborhood}, {formatBorough(listing.borough)}
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/70" />

          {/* Financial details row */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {/* Annual Revenue */}
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

            {/* Cash Flow / SDE */}
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

          {/* Footer: Days on market + broker info */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span>
                {daysOnMarket === 0
                  ? "Listed today"
                  : daysOnMarket === 1
                    ? "1 day on market"
                    : `${daysOnMarket} days on market`}
              </span>
            </div>
            <span
              className="truncate text-xs text-muted-foreground/70 max-w-[45%] text-right"
              title={`${listerName}${brokerageSuffix}`}
            >
              {listerName}
              {brokerageSuffix}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
