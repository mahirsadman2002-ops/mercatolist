"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

interface ListingPin {
  id: string;
  slug: string;
  title: string;
  latitude: number;
  longitude: number;
  askingPrice: number;
  neighborhood?: string;
  category?: string;
  photoUrl?: string | null;
}

interface MapViewProps {
  listings: ListingPin[];
  /** When set, popups show a "Select" checkbox tied to addToCollection mode. */
  addToCollectionId?: string;
  /** Set of listing IDs already in the target collection (shown as checked + disabled). */
  alreadyInCollection?: Set<string>;
  /** Set of listing IDs currently pending selection. */
  selectedIds?: Set<string>;
  /** Called when the popup checkbox is clicked. */
  onToggleSelection?: (listingId: string) => void;
}

function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    return `$${(price / 1_000_000).toFixed(1)}M`;
  }
  if (price >= 1_000) {
    return `$${(price / 1_000).toFixed(0)}K`;
  }
  return `$${price.toLocaleString()}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function MapView({
  listings,
  addToCollectionId,
  alreadyInCollection,
  selectedIds,
  onToggleSelection,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [, setMapReady] = useState(false);
  const token = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "").trim() || null;

  // Keep latest selection state in a ref so the delegated click handler reads fresh values.
  const stateRef = useRef({
    addToCollectionId,
    alreadyInCollection,
    selectedIds,
    onToggleSelection,
  });
  stateRef.current = {
    addToCollectionId,
    alreadyInCollection,
    selectedIds,
    onToggleSelection,
  };

  useEffect(() => {
    if (!token || !mapContainer.current) return;

    let map: mapboxgl.Map;

    import("mapbox-gl").then((mapboxgl) => {
      // Load CSS via link tag to avoid TS module resolution issues
      if (!document.querySelector('link[href*="mapbox-gl"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";
        document.head.appendChild(link);
      }

      mapboxgl.default.accessToken = token;

      map = new mapboxgl.default.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/light-v11",
        center: [-73.98, 40.75],
        zoom: 11,
        interactive: true,
      });

      map.addControl(new mapboxgl.default.NavigationControl(), "top-right");
      mapRef.current = map;

      map.on("load", () => {
        setMapReady(true);
        addMarkers(mapboxgl.default);
      });
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [token]);

  // Re-render markers when listings change.
  useEffect(() => {
    if (!mapRef.current || !token) return;
    import("mapbox-gl").then((mapboxgl) => {
      addMarkers(mapboxgl.default);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings, token, addToCollectionId]);

  // Delegated click on the map container to handle popup checkbox clicks.
  useEffect(() => {
    const container = mapContainer.current;
    if (!container) return;
    const handler = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest<HTMLButtonElement>(
        "[data-map-select-listing]",
      );
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute("data-map-select-listing");
      if (id && stateRef.current.onToggleSelection) {
        stateRef.current.onToggleSelection(id);
      }
    };
    container.addEventListener("click", handler);
    return () => container.removeEventListener("click", handler);
  }, []);

  function addMarkers(mapboxgl: typeof import("mapbox-gl").default) {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const inBrowseMode = !!addToCollectionId;
    const detailQuery = inBrowseMode
      ? `?addToCollection=${addToCollectionId}`
      : "";

    listings.forEach((listing) => {
      const isAlreadyIn = alreadyInCollection?.has(listing.id) ?? false;
      const isSelected = selectedIds?.has(listing.id) ?? false;

      const photoHtml = listing.photoUrl
        ? `<img src="${escapeHtml(listing.photoUrl)}" alt="" style="display:block;width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:6px;" />`
        : "";

      const metaParts: string[] = [];
      if (listing.neighborhood) metaParts.push(escapeHtml(listing.neighborhood));
      if (listing.category) metaParts.push(escapeHtml(listing.category));
      const metaHtml = metaParts.length
        ? `<p style="font-size:11px;margin:0 0 4px 0;color:#718096;">${metaParts.join(" · ")}</p>`
        : "";

      const selectButtonHtml = inBrowseMode
        ? `<button
            type="button"
            data-map-select-listing="${escapeHtml(listing.id)}"
            ${isAlreadyIn ? "disabled" : ""}
            style="
              display:flex;
              align-items:center;
              gap:6px;
              width:100%;
              margin-top:6px;
              padding:6px 10px;
              border-radius:6px;
              border:1px solid ${isAlreadyIn ? "#10b981" : isSelected ? "#0d9488" : "#cbd5e1"};
              background:${isAlreadyIn ? "#d1fae5" : isSelected ? "#0d9488" : "#ffffff"};
              color:${isAlreadyIn ? "#065f46" : isSelected ? "#ffffff" : "#1a1f36"};
              cursor:${isAlreadyIn ? "default" : "pointer"};
              font-size:12px;
              font-weight:600;
              font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            "
          >
            <span style="
              display:inline-flex;
              align-items:center;
              justify-content:center;
              width:14px;
              height:14px;
              border:1.5px solid ${isAlreadyIn || isSelected ? "currentColor" : "#94a3b8"};
              border-radius:3px;
              background:${isAlreadyIn || isSelected ? "currentColor" : "transparent"};
            ">
              ${
                isAlreadyIn || isSelected
                  ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="${isAlreadyIn ? "#065f46" : "#0d9488"}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
                  : ""
              }
            </span>
            <span>${isAlreadyIn ? "Already in collection" : isSelected ? "Selected" : "Select for collection"}</span>
          </button>`
        : "";

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        maxWidth: "240px",
      }).setHTML(
        `<div style="padding:4px 0;width:220px;">
          <a href="/listings/${escapeHtml(listing.slug)}${detailQuery}" style="text-decoration:none;color:inherit;display:block;">
            ${photoHtml}
            <p style="font-weight:600;font-size:13px;margin:0 0 4px 0;color:#1a1f36;line-height:1.3;">${escapeHtml(listing.title)}</p>
            ${metaHtml}
            <p style="font-weight:700;font-size:14px;margin:0;color:#0d9488;">${formatPrice(listing.askingPrice)}</p>
          </a>
          ${selectButtonHtml}
        </div>`,
      );

      const marker = new mapboxgl.Marker({ color: "#0d9488" })
        .setLngLat([listing.longitude, listing.latitude])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Fit bounds if there are listings
    if (listings.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      listings.forEach((l) => bounds.extend([l.longitude, l.latitude]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
    }
  }

  // Fallback when no token
  if (!token) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg border border-border/60 bg-muted">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted-foreground/10">
            <MapPin className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Map view is currently unavailable
          </p>
          <p className="text-xs text-muted-foreground/70">
            Please try again later
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[400px] overflow-hidden rounded-lg border border-border/60">
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
}
