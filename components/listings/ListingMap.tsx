"use client";

// ---------------------------------------------------------------------------
// ListingMap — Styled map placeholder for listing detail pages
// ---------------------------------------------------------------------------
//
// HOW TO ADD ACTUAL MAPBOX GL JS INTEGRATION:
//
// 1. Install mapbox-gl (already in package.json) and import it:
//      import mapboxgl from "mapbox-gl";
//      import "mapbox-gl/dist/mapbox-gl.css";
//
// 2. Set your Mapbox access token in .env.local:
//      NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxxx
//
// 3. Replace the placeholder <div> below with a ref-based container:
//      const mapContainer = useRef<HTMLDivElement>(null);
//
//      useEffect(() => {
//        if (!mapContainer.current) return;
//        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
//        const map = new mapboxgl.Map({
//          container: mapContainer.current,
//          style: "mapbox://styles/mapbox/light-v11",
//          center: [longitude, latitude],
//          zoom: 15,
//          interactive: true,
//        });
//
//        // Add marker
//        new mapboxgl.Marker({ color: "#0d9488" })
//          .setLngLat([longitude, latitude])
//          .addTo(map);
//
//        // If hideAddress is true, add a privacy circle instead of a pin:
//        // map.on("load", () => {
//        //   map.addSource("privacy-circle", {
//        //     type: "geojson",
//        //     data: turf.circle([longitude, latitude], 0.3, { units: "kilometers" }),
//        //   });
//        //   map.addLayer({
//        //     id: "privacy-circle-fill",
//        //     type: "fill",
//        //     source: "privacy-circle",
//        //     paint: { "fill-color": "#0d9488", "fill-opacity": 0.15 },
//        //   });
//        // });
//
//        return () => map.remove();
//      }, [latitude, longitude, hideAddress]);
//
// 4. Return <div ref={mapContainer} className="h-full w-full" /> inside
//    the aspect-video wrapper.
// ---------------------------------------------------------------------------

import { MapPin, ExternalLink, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListingMapProps {
  latitude: number;
  longitude: number;
  hideAddress: boolean;
  address?: string;
  neighborhood: string;
  borough: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBorough(borough: string): string {
  return borough
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}&z=16`;
}

// ---------------------------------------------------------------------------
// ListingMap
// ---------------------------------------------------------------------------

export function ListingMap({
  latitude,
  longitude,
  hideAddress,
  address,
  neighborhood,
  borough,
}: ListingMapProps) {
  const displayBorough = formatBorough(borough);

  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      {/* Map placeholder container — aspect-video */}
      <div
        className="relative flex aspect-video w-full flex-col items-center justify-center gap-4 overflow-hidden bg-navy px-6 text-center"
        style={{
          backgroundImage: [
            // Subtle grid lines to suggest a map grid
            "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)",
            // Faint radial highlight behind the pin
            "radial-gradient(ellipse at center, rgba(13,148,136,.12) 0%, transparent 60%)",
          ].join(", "),
          backgroundSize: "48px 48px, 48px 48px, 100% 100%",
        }}
      >
        {/* Decorative cross-hairs (subtle) */}
        <div className="pointer-events-none absolute inset-0">
          {/* Horizontal center line */}
          <div className="absolute left-0 right-0 top-1/2 h-px bg-white/[.04]" />
          {/* Vertical center line */}
          <div className="absolute bottom-0 left-1/2 top-0 w-px bg-white/[.04]" />
        </div>

        {/* Pin icon */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-teal/15 ring-1 ring-teal/20">
          <MapPin className="h-8 w-8 text-teal" strokeWidth={1.75} />
        </div>

        {/* Neighborhood & Borough */}
        <div className="relative flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-white sm:text-xl">
            {neighborhood}
          </h3>
          <p className="text-sm font-medium text-white/60">
            {displayBorough}, New York
          </p>
        </div>

        {/* Address or privacy notice */}
        <div className="relative max-w-md">
          {hideAddress ? (
            <div className="flex items-center gap-2 rounded-lg bg-white/[.06] px-4 py-2.5 text-sm text-white/50">
              <Shield
                className="h-4 w-4 shrink-0 text-teal/70"
                strokeWidth={2}
              />
              <span>
                Approximate location — exact address hidden for privacy
              </span>
            </div>
          ) : address ? (
            <p className="text-sm font-medium text-white/70">{address}</p>
          ) : null}
        </div>

        {/* Google Maps link */}
        <a
          href={googleMapsUrl(latitude, longitude)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "relative inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200",
            "bg-teal text-white hover:bg-teal-light hover:scale-[1.02] active:scale-[0.98]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
          )}
        >
          View on Google Maps
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.5} />
        </a>

        {/* Coordinates (small, bottom-right) */}
        <span className="absolute bottom-3 right-3 text-[10px] font-mono text-white/25">
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </span>
      </div>
    </div>
  );
}
