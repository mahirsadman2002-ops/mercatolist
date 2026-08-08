"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Expand,
  MapPin,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ListingMap } from "./ListingMap";
import { pickPhotoUrl } from "@/lib/listing-image";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PhotoGalleryProps {
  photos: {
    id: string;
    url: string;
    thumbUrl?: string | null;
    cardUrl?: string | null;
    fullUrl?: string | null;
    order: number;
  }[];
  title: string;
  latitude?: number;
  longitude?: number;
  /**
   * Location context for the interactive map slide. When provided, the final
   * slide renders a real Mapbox map (with privacy circle if hideAddress) instead
   * of the static placeholder.
   */
  hideAddress?: boolean;
  address?: string;
  neighborhood?: string;
  borough?: string;
  locationPrecision?: "EXACT" | "NEIGHBORHOOD" | "BOROUGH";
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The virtual "map slide" index is always `photos.length` (last position). */
const MAP_SLIDE_LABEL = "View on Map";

// ---------------------------------------------------------------------------
// PhotoGallery
// ---------------------------------------------------------------------------

export function PhotoGallery({
  photos,
  title,
  latitude,
  longitude,
  hideAddress = false,
  address,
  neighborhood,
  borough,
  locationPrecision = "EXACT",
}: PhotoGalleryProps) {
  const sortedPhotos = [...photos].sort((a, b) => a.order - b.order);
  const hasCoords =
    latitude !== undefined &&
    longitude !== undefined &&
    latitude !== 0 &&
    longitude !== 0;

  // Mapbox Static Images URL for the map-thumbnail buttons. Single 192x128 @2x
  // image works for both the inline strip and the lightbox strip via object-cover.
  // When hideAddress is on, drop the marker and zoom out so the precise point
  // isn't implied by the thumbnail.
  const mapboxToken =
    (process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "").trim() || null;
  const mapThumbnailUrl =
    hasCoords && mapboxToken
      ? (() => {
          const lng = longitude!.toFixed(5);
          const lat = latitude!.toFixed(5);
          const zoom = !hideAddress
            ? 15
            : locationPrecision === "BOROUGH"
              ? 9
              : locationPrecision === "NEIGHBORHOOD"
                ? 11.5
                : 13;
          const marker = hideAddress ? "" : `pin-s+0d9488(${lng},${lat})/`;
          return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${marker}${lng},${lat},${zoom},0/192x128@2x?access_token=${mapboxToken}`;
        })()
      : null;

  // Total slide count: photos + optional map slide
  const totalSlides = sortedPhotos.length + (hasCoords ? 1 : 0);

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const activeThumbnailRef = useRef<HTMLButtonElement>(null);

  // -----------------------------------------------------------------------
  // Navigation helpers
  // -----------------------------------------------------------------------

  const goTo = useCallback(
    (index: number) => {
      if (totalSlides === 0) return;
      setActiveIndex(
        ((index % totalSlides) + totalSlides) % totalSlides
      );
    },
    [totalSlides]
  );

  const goNext = useCallback(
    () => goTo(activeIndex + 1),
    [activeIndex, goTo]
  );
  const goPrev = useCallback(
    () => goTo(activeIndex - 1),
    [activeIndex, goTo]
  );

  const openLightbox = useCallback(() => setLightboxOpen(true), []);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  // -----------------------------------------------------------------------
  // Keyboard navigation
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!lightboxOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goPrev();
          break;
        case "ArrowRight":
          e.preventDefault();
          goNext();
          break;
        case "Escape":
          e.preventDefault();
          closeLightbox();
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, goNext, goPrev, closeLightbox]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (activeThumbnailRef.current && thumbnailContainerRef.current) {
      activeThumbnailRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeIndex]);

  // -----------------------------------------------------------------------
  // Helpers: determine what to render for a given slide index
  // -----------------------------------------------------------------------

  const isMapSlide = (index: number) =>
    hasCoords && index === sortedPhotos.length;

  // The interactive map can only be rendered if we have all the location
  // context. If a caller only passes coords (no neighborhood/borough), fall
  // back to the static placeholder so we don't crash ListingMap.
  const canRenderInteractiveMap =
    hasCoords && neighborhood !== undefined && borough !== undefined;

  // -----------------------------------------------------------------------
  // Render: Map Placeholder slide
  // -----------------------------------------------------------------------

  function MapPlaceholder({ className }: { className?: string }) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 bg-navy text-white",
          className
        )}
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal/20">
          <MapPin className="h-7 w-7 text-teal" strokeWidth={1.75} />
        </div>
        <span className="text-sm font-semibold tracking-wide">
          {MAP_SLIDE_LABEL}
        </span>
        {hasCoords && (
          <span className="text-xs text-white/50">
            {latitude!.toFixed(4)}, {longitude!.toFixed(4)}
          </span>
        )}
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: No photos state
  // -----------------------------------------------------------------------

  if (totalSlides === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-border/60">
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-muted">
          <Building2
            className="h-16 w-16 text-muted-foreground/30"
            strokeWidth={1.25}
          />
          <p className="text-sm font-medium text-muted-foreground">
            No photos available
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: main gallery
  // -----------------------------------------------------------------------

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/60">
        {/* ----------------------------------------------------------------
            Main photo display — 16:9 aspect ratio
        ---------------------------------------------------------------- */}
        <div className="group/main relative aspect-video w-full overflow-hidden bg-muted">
          {isMapSlide(activeIndex) ? (
            canRenderInteractiveMap ? (
              <div className="absolute inset-0">
                <ListingMap
                  latitude={latitude!}
                  longitude={longitude!}
                  hideAddress={hideAddress}
                  address={address}
                  neighborhood={neighborhood!}
                  borough={borough!}
                  locationPrecision={locationPrecision}
                  embedded
                />
              </div>
            ) : (
              <MapPlaceholder className="h-full w-full" />
            )
          ) : (
            <Image
              src={pickPhotoUrl(sortedPhotos[activeIndex], "full")}
              alt={`${title} — photo ${activeIndex + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 66vw, 50vw"
              className="object-cover transition-opacity duration-300"
              priority={activeIndex === 0}
            />
          )}

          {/* Gradient overlay for controls */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 opacity-0 transition-opacity duration-200 group-hover/main:opacity-100" />

          {/* Previous / Next arrows on main photo */}
          {totalSlides > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/70 hover:scale-105 active:scale-95 opacity-0 group-hover/main:opacity-100 focus-visible:opacity-100"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/70 hover:scale-105 active:scale-95 opacity-0 group-hover/main:opacity-100 focus-visible:opacity-100"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </>
          )}

          {/* Expand / fullscreen button */}
          <button
            type="button"
            onClick={openLightbox}
            aria-label="Open fullscreen gallery"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-black/50 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/70 hover:scale-105 active:scale-95 opacity-0 group-hover/main:opacity-100 focus-visible:opacity-100"
          >
            <Expand className="h-4 w-4" strokeWidth={2} />
          </button>

          {/* Photo counter */}
          <div className="absolute bottom-3 left-3 z-10 rounded-md bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {activeIndex + 1} / {totalSlides}
          </div>
        </div>

        {/* ----------------------------------------------------------------
            Thumbnail strip
        ---------------------------------------------------------------- */}
        {totalSlides > 1 && (
          <div
            ref={thumbnailContainerRef}
            className="flex gap-1.5 overflow-x-auto bg-muted/50 p-2 scrollbar-thin"
            role="tablist"
            aria-label="Photo thumbnails"
          >
            {sortedPhotos.map((photo, index) => (
              <button
                key={photo.id}
                ref={index === activeIndex ? activeThumbnailRef : null}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`View photo ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-md transition-all duration-200",
                  index === activeIndex
                    ? "ring-2 ring-teal ring-offset-1 ring-offset-background opacity-100"
                    : "opacity-60 hover:opacity-90"
                )}
              >
                <Image
                  src={pickPhotoUrl(photo, "thumb")}
                  alt={`${title} — thumbnail ${index + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            ))}

            {/* Map thumbnail */}
            {hasCoords && (
              <button
                ref={
                  sortedPhotos.length === activeIndex
                    ? activeThumbnailRef
                    : null
                }
                type="button"
                role="tab"
                aria-selected={activeIndex === sortedPhotos.length}
                aria-label={MAP_SLIDE_LABEL}
                onClick={() => setActiveIndex(sortedPhotos.length)}
                className={cn(
                  "relative flex h-16 w-24 shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-md bg-navy text-white transition-all duration-200",
                  activeIndex === sortedPhotos.length
                    ? "ring-2 ring-teal ring-offset-1 ring-offset-background opacity-100"
                    : "opacity-60 hover:opacity-90"
                )}
                style={
                  mapThumbnailUrl
                    ? undefined
                    : {
                        backgroundImage:
                          "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
                        backgroundSize: "12px 12px",
                      }
                }
              >
                {mapThumbnailUrl && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mapThumbnailUrl}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/35" />
                  </>
                )}
                <MapPin
                  className="relative h-4 w-4 text-teal drop-shadow"
                  strokeWidth={2}
                />
                <span className="relative text-[9px] font-semibold leading-none tracking-wide drop-shadow">
                  Map
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------
          Fullscreen lightbox overlay
      ------------------------------------------------------------------ */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery lightbox"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={closeLightbox}
            aria-label="Close lightbox"
            className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>

          {/* Photo counter */}
          <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            {activeIndex + 1} / {totalSlides}
          </div>

          {/* Main lightbox content */}
          <div
            className="relative flex h-full w-full items-center justify-center px-4 py-16 sm:px-16"
            onClick={(e) => e.stopPropagation()}
          >
            {isMapSlide(activeIndex) ? (
              canRenderInteractiveMap ? (
                <div className="h-full max-h-[80vh] w-full max-w-5xl overflow-hidden rounded-xl">
                  <ListingMap
                    latitude={latitude!}
                    longitude={longitude!}
                    hideAddress={hideAddress}
                    address={address}
                    neighborhood={neighborhood!}
                    borough={borough!}
                    locationPrecision={locationPrecision}
                    embedded
                  />
                </div>
              ) : (
                <MapPlaceholder className="h-full max-h-[80vh] w-full max-w-5xl rounded-xl" />
              )
            ) : (
              <div className="relative h-full w-full max-h-[80vh] max-w-5xl">
                <Image
                  src={pickPhotoUrl(sortedPhotos[activeIndex], "full")}
                  alt={`${title} — photo ${activeIndex + 1}`}
                  fill
                  sizes="100vw"
                  className="object-contain transition-opacity duration-300"
                  priority
                />
              </div>
            )}
          </div>

          {/* Previous arrow */}
          {totalSlides > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95 sm:left-6"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
            </button>
          )}

          {/* Next arrow */}
          {totalSlides > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95 sm:right-6"
            >
              <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
            </button>
          )}

          {/* Lightbox thumbnail strip at bottom */}
          <div className="absolute bottom-4 left-0 right-0 z-50 flex justify-center px-4">
            <div className="flex gap-2 overflow-x-auto rounded-xl bg-black/40 p-2 backdrop-blur-md max-w-full">
              {sortedPhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  aria-label={`View photo ${index + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex(index);
                  }}
                  className={cn(
                    "relative h-12 w-18 shrink-0 overflow-hidden rounded-md transition-all duration-200",
                    index === activeIndex
                      ? "ring-2 ring-teal opacity-100"
                      : "opacity-50 hover:opacity-80"
                  )}
                >
                  <Image
                    src={pickPhotoUrl(photo, "thumb")}
                    alt={`${title} — thumbnail ${index + 1}`}
                    fill
                    sizes="72px"
                    className="object-cover"
                  />
                </button>
              ))}

              {/* Map thumbnail in lightbox */}
              {hasCoords && (
                <button
                  type="button"
                  aria-label={MAP_SLIDE_LABEL}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex(sortedPhotos.length);
                  }}
                  className={cn(
                    "relative flex h-12 w-18 shrink-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-md bg-navy transition-all duration-200",
                    activeIndex === sortedPhotos.length
                      ? "ring-2 ring-teal opacity-100"
                      : "opacity-50 hover:opacity-80"
                  )}
                  style={
                    mapThumbnailUrl
                      ? undefined
                      : {
                          backgroundImage:
                            "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
                          backgroundSize: "10px 10px",
                        }
                  }
                >
                  {mapThumbnailUrl && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={mapThumbnailUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/35" />
                    </>
                  )}
                  <MapPin
                    className="relative h-3.5 w-3.5 text-teal drop-shadow"
                    strokeWidth={2}
                  />
                  <span className="relative text-[8px] font-semibold text-white leading-none drop-shadow">
                    Map
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
