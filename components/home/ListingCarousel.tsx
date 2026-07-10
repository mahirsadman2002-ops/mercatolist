"use client";

import { useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ListingCard } from "@/components/listings/ListingCard";
import { Button } from "@/components/ui/button";

interface CarouselListing {
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
}

interface ListingCarouselProps {
  listings: CarouselListing[];
}

export function ListingCarousel({ listings }: ListingCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  // Desktop arrow buttons only. Touch/trackpad scrolling is handled entirely by
  // the browser's native horizontal scroll + CSS scroll-snap below — we do NOT
  // intercept touch events. (The old onTouchStart/End handlers fired their own
  // scrollBy on top of the native scroll, so one swipe moved twice and landed
  // at random offsets. Let the platform do what it's good at.)
  const scroll = useCallback((direction: "left" | "right") => {
    const track = trackRef.current;
    if (!track) return;
    const cardWidth = 344; // 320px card + 24px gap
    track.scrollBy({
      left: direction === "left" ? -cardWidth * 2 : cardWidth * 2,
      behavior: "smooth",
    });
  }, []);

  if (listings.length === 0) return null;

  return (
    <div className="relative group">
      {/* Arrow buttons — desktop only */}
      <Button
        variant="outline"
        size="icon"
        className="absolute -left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border bg-background shadow-lg md:flex opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => scroll("left")}
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border bg-background shadow-lg md:flex opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => scroll("right")}
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Scrollable track — native horizontal scroll + one-card snap. */}
      <div
        ref={trackRef}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-4 scrollbar-hide snap-x snap-mandatory overscroll-x-contain"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {listings.map((listing) => (
          <div key={listing.id} className="w-[320px] shrink-0 snap-start">
            <ListingCard listing={listing} />
          </div>
        ))}
      </div>
    </div>
  );
}
