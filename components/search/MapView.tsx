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
}

interface MapViewProps {
  listings: ListingPin[];
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

export function MapView({ listings }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [, setMapReady] = useState(false);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

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
      // Clean up markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [token]);

  // Update markers when listings change
  useEffect(() => {
    if (!mapRef.current || !token) return;

    import("mapbox-gl").then((mapboxgl) => {
      addMarkers(mapboxgl.default);
    });
  }, [listings, token]);

  function addMarkers(mapboxgl: typeof import("mapbox-gl").default) {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    listings.forEach((listing) => {
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        maxWidth: "240px",
      }).setHTML(
        `<div style="padding:4px 0;">
          <a href="/listings/${listing.slug}" style="text-decoration:none;color:inherit;">
            <p style="font-weight:600;font-size:14px;margin:0 0 4px 0;color:#1a1f36;">${listing.title}</p>
            <p style="font-weight:700;font-size:15px;margin:0;color:#0d9488;">${formatPrice(listing.askingPrice)}</p>
          </a>
        </div>`
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
            Map view requires configuration
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
