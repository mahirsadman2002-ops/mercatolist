"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Shield, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListingMapProps {
  latitude: number;
  longitude: number;
  hideAddress: boolean;
  address?: string;
  neighborhood: string;
  borough: string;
}

function formatBorough(borough: string): string {
  return borough
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}&z=16`;
}

/**
 * Generate a GeoJSON circle polygon for the privacy radius.
 * Avoids needing @turf/circle as a dependency.
 */
function createCircleGeoJSON(
  center: [number, number],
  radiusKm: number,
  steps = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const [lng, lat] = center;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dx = radiusKm * Math.cos(angle);
    const dy = radiusKm * Math.sin(angle);
    const newLat = lat + (dy / 111.32);
    const newLng = lng + (dx / (111.32 * Math.cos((lat * Math.PI) / 180)));
    coords.push([newLng, newLat]);
  }
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
  };
}

export function ListingMap({
  latitude,
  longitude,
  hideAddress,
  address,
  neighborhood,
  borough,
}: ListingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const displayBorough = formatBorough(borough);

  useEffect(() => {
    if (!token || !mapContainer.current) return;

    let map: mapboxgl.Map;

    // Dynamic import to avoid SSR issues with mapbox-gl
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
        center: [longitude, latitude],
        zoom: hideAddress ? 14 : 16,
        interactive: true,
      });

      map.addControl(new mapboxgl.default.NavigationControl(), "top-right");

      mapRef.current = map;

      if (hideAddress) {
        // Show privacy circle instead of exact marker
        map.on("load", () => {
          const circleData = createCircleGeoJSON(
            [longitude, latitude],
            0.5 // 500m radius
          );

          map.addSource("privacy-circle", {
            type: "geojson",
            data: circleData,
          });

          map.addLayer({
            id: "privacy-circle-fill",
            type: "fill",
            source: "privacy-circle",
            paint: {
              "fill-color": "#0d9488",
              "fill-opacity": 0.15,
            },
          });

          map.addLayer({
            id: "privacy-circle-outline",
            type: "line",
            source: "privacy-circle",
            paint: {
              "line-color": "#0d9488",
              "line-width": 2,
              "line-opacity": 0.4,
            },
          });

          setMapLoaded(true);
        });
      } else {
        // Show exact marker
        new mapboxgl.default.Marker({ color: "#0d9488" })
          .setLngLat([longitude, latitude])
          .addTo(map);

        map.on("load", () => {
          setMapLoaded(true);
        });
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, hideAddress, token]);

  // Fallback when no token is configured
  if (!token) {
    return (
      <div className="overflow-hidden rounded-xl border border-border/60">
        <div className="relative flex h-[400px] w-full flex-col items-center justify-center gap-4 bg-muted px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted-foreground/10">
            <MapPin className="h-8 w-8 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold text-foreground">
              {neighborhood}
            </h3>
            <p className="text-sm font-medium text-muted-foreground">
              {displayBorough}, New York
            </p>
          </div>
          {!hideAddress && address && (
            <p className="text-sm text-muted-foreground">{address}</p>
          )}
          {hideAddress && (
            <div className="flex items-center gap-2 rounded-lg bg-muted-foreground/5 px-4 py-2.5 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span>Approximate location shown for privacy</span>
            </div>
          )}
          <a
            href={googleMapsUrl(latitude, longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200",
              "bg-teal text-white hover:bg-teal-light hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            View on Google Maps
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.5} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <div className="relative h-[400px] w-full">
        <div ref={mapContainer} className="h-full w-full" />
        {/* Overlay info while map loads or always visible */}
        {hideAddress && mapLoaded && (
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
            <Shield className="h-3.5 w-3.5 text-teal" strokeWidth={2} />
            Approximate location — exact address hidden
          </div>
        )}
        {!hideAddress && address && mapLoaded && (
          <div className="absolute bottom-3 left-3 z-10 rounded-lg bg-white/90 px-3 py-2 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
            {address}
          </div>
        )}
      </div>
    </div>
  );
}
