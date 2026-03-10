"use client";

import { useRef, useState, useCallback } from "react";
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
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const scroll = useCallback((direction: "left" | "right") => {
    const track = trackRef.current;
    if (!track) return;
    const cardWidth = 344; // 320px card + 24px gap
    track.scrollBy({
      left: direction === "left" ? -cardWidth * 2 : cardWidth * 2,
      behavior: "smooth",
    });
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      scroll(diff > 0 ? "right" : "left");
    }
    setTouchStart(null);
  };

  if (listings.length === 0) return null;

  // Duplicate for seamless infinite loop (CSS animation approach)
  const duplicated = [...listings, ...listings];

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

      {/* Scrollable track */}
      <div
        ref={trackRef}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-4 scrollbar-hide"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {duplicated.map((listing, i) => (
          <div
            key={`${listing.id}-${i}`}
            className="w-[320px] shrink-0"
          >
            <ListingCard listing={listing} />
          </div>
        ))}
      </div>
    </div>
  );
}
