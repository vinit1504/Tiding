"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import { Clock, LocateFixed } from "lucide-react";

export function useRiderProgress(start = 0.45, end = 0.95) {
  const [progress, setProgress] = useState(start);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => (p >= end ? p : Math.min(end, p + 0.003)));
    }, 1200);
    return () => clearInterval(id);
  }, [end]);

  return progress;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LiveDeliveryMapProps {
  userCoordinates?: Coordinates;
  storeCoordinates?: Coordinates;
  storeName?: string;
  destinationAddress?: string;
  progress?: number;
  distanceKm: string;
  etaMins: number;
  riderName: string;
}

export function LiveDeliveryMap({
  userCoordinates,
  storeCoordinates,
  storeName = "Tiding Express Store",
  destinationAddress = "Your Delivery Address",
  progress: progressProp,
  distanceKm,
  etaMins,
  riderName,
}: LiveDeliveryMapProps) {
  const internalProgress = useRiderProgress();
  const currentProgress = progressProp ?? internalProgress;

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const dashedRouteRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // 1. Resolve coordinates with defaults (e.g. Surat)
  const homeLat =
    userCoordinates?.latitude && !isNaN(userCoordinates.latitude) && userCoordinates.latitude !== 0
      ? userCoordinates.latitude
      : 21.1702;
  const homeLng =
    userCoordinates?.longitude && !isNaN(userCoordinates.longitude) && userCoordinates.longitude !== 0
      ? userCoordinates.longitude
      : 72.8311;

  const storeLat =
    storeCoordinates?.latitude && !isNaN(storeCoordinates.latitude) && storeCoordinates.latitude !== 0
      ? storeCoordinates.latitude
      : homeLat - 0.012;
  const storeLng =
    storeCoordinates?.longitude && !isNaN(storeCoordinates.longitude) && storeCoordinates.longitude !== 0
      ? storeCoordinates.longitude
      : homeLng - 0.015;

  // 2. Smooth Curved Route Arc (Quadratic Bezier between store/rider and destination as in the image)
  const routePoints: [number, number][] = useMemo(() => {
    const points: [number, number][] = [];
    const steps = 36;

    const midLat = (storeLat + homeLat) / 2;
    const midLng = (storeLng + homeLng) / 2;
    const dLat = homeLat - storeLat;
    const dLng = homeLng - storeLng;

    // Perpendicular bow offset for natural curve
    const ctrlLat = midLat - dLng * 0.32;
    const ctrlLng = midLng + dLat * 0.32;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat =
        Math.pow(1 - t, 2) * storeLat +
        2 * (1 - t) * t * ctrlLat +
        Math.pow(t, 2) * homeLat;
      const lng =
        Math.pow(1 - t, 2) * storeLng +
        2 * (1 - t) * t * ctrlLng +
        Math.pow(t, 2) * homeLng;
      points.push([lat, lng]);
    }

    return points;
  }, [storeLat, storeLng, homeLat, homeLng]);

  // Interpolate point along curve at progress [0..1]
  const getPointAtProgress = (pct: number): { lat: number; lng: number; index: number } => {
    const clamped = Math.max(0, Math.min(1, pct));
    const totalSegments = routePoints.length - 1;
    const scaled = clamped * totalSegments;
    const index = Math.min(Math.floor(scaled), totalSegments - 1);
    const subPct = scaled - index;

    const pA = routePoints[index];
    const pB = routePoints[index + 1];

    const lat = pA[0] + (pB[0] - pA[0]) * subPct;
    const lng = pA[1] + (pB[1] - pA[1]) * subPct;

    return { lat, lng, index };
  };

  // 3. Initialize Leaflet Map with Google-like Street Tiles & Custom Markers
  useEffect(() => {
    let isMounted = true;
    let L: any = null;

    async function initLeafletMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      L = await import("leaflet");
      if (!isMounted || !mapContainerRef.current) return;

      // Fix Next.js default icon path issues
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // ─────────────────────────────────────────────────────────────
      // Custom Rider Pin Marker (Matching Attached Screenshot)
      // Top: Black circular badge with green grocery bag
      // Bottom: Rider body with yellow helmet pointer
      // ─────────────────────────────────────────────────────────────
      const riderPinIcon = L.divIcon({
        className: "custom-rider-pin",
        html: `
          <div style="position: relative; width: 44px; height: 56px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; cursor: pointer;">
            <!-- Top Black Circle with Green Grocery Bag -->
            <div style="position: relative; width: 36px; height: 36px; border-radius: 50%; background: #111827; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; z-index: 2;">
              <div style="position: relative; width: 20px; height: 20px; background: #18A818; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                <!-- Handle -->
                <div style="position: absolute; top: -3px; width: 8px; height: 4px; border: 1.5px solid #ffffff; border-bottom: none; border-radius: 2px 2px 0 0;"></div>
                <!-- 2 white dots (eyes / smile) -->
                <div style="display: flex; gap: 3px; margin-top: 2px;">
                  <span style="width: 2.5px; height: 2.5px; background: #ffffff; border-radius: 50%;"></span>
                  <span style="width: 2.5px; height: 2.5px; background: #ffffff; border-radius: 50%;"></span>
                </div>
              </div>
            </div>
            <!-- Rider Head (Yellow Helmet) & Body Arrow Pointer -->
            <div style="position: relative; margin-top: -6px; display: flex; flex-direction: column; align-items: center; z-index: 1;">
              <!-- Yellow Helmet -->
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #FACC15; border: 1.5px solid #111827; box-shadow: 0 2px 4px rgba(0,0,0,0.25);"></div>
              <!-- Green Pointer Arrow -->
              <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 10px solid #18A818; margin-top: -2px;"></div>
            </div>
          </div>
        `,
        iconSize: [44, 56],
        iconAnchor: [22, 54],
      });

      // ─────────────────────────────────────────────────────────────
      // Custom Home Destination Pin Marker (Matching Attached Screenshot)
      // White circle with black border + amber house icon
      // Black pointer tip + electric blue glowing dot on the ground
      // ─────────────────────────────────────────────────────────────
      const homePinIcon = L.divIcon({
        className: "custom-home-pin",
        html: `
          <div style="position: relative; width: 42px; height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; cursor: pointer;">
            <!-- White Circular Badge with Black Outline -->
            <div style="width: 32px; height: 32px; border-radius: 50%; background: #ffffff; border: 2.5px solid #111827; box-shadow: 0 3px 10px rgba(0,0,0,0.22); display: flex; align-items: center; justify-content: center; z-index: 2;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#FEF3C7"></path>
                <polyline points="9 22 9 12 15 12 15 22" stroke="#B45309"></polyline>
              </svg>
            </div>
            <!-- Black Pointer Tip -->
            <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #111827; margin-top: -1px; z-index: 2;"></div>
            <!-- Bright Blue Glow Beneath the Pin -->
            <div style="margin-top: 2px; width: 16px; height: 7px; border-radius: 50%; background: #0088FF; box-shadow: 0 0 8px #0088FF, 0 0 4px #0088FF; z-index: 1;"></div>
          </div>
        `,
        iconSize: [42, 50],
        iconAnchor: [21, 48],
      });

      // Initialize map instance
      const map = L.map(mapContainerRef.current, {
        center: [(storeLat + homeLat) / 2, (storeLng + homeLng) / 2],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // Clean Light Google-Like Map Tiles (Positron / Voyager light streets)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // ─────────────────────────────────────────────────────────────
      // Curved Black Dashed Route Line (as shown in the image)
      // ─────────────────────────────────────────────────────────────
      const riderPos = getPointAtProgress(currentProgress);
      const activeDashedPath = [
        [riderPos.lat, riderPos.lng],
        ...routePoints.slice(riderPos.index + 1),
      ];

      const dashedRoute = L.polyline(activeDashedPath, {
        color: "#18181b",
        weight: 3.5,
        opacity: 0.9,
        dashArray: "7, 7",
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      dashedRouteRef.current = dashedRoute;

      // Add Destination Marker (Customer Home)
      L.marker([homeLat, homeLng], { icon: homePinIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
            <strong style="color: #0f172a; font-weight: 600;">Delivery Destination</strong>
            <p style="margin: 2px 0 0; color: #64748b;">${destinationAddress}</p>
          </div>
        `);

      // Add Delivery Partner Marker
      const riderMarker = L.marker([riderPos.lat, riderPos.lng], {
        icon: riderPinIcon,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
            <strong style="color: #18A818; font-weight: 600;">${riderName}</strong>
            <p style="margin: 2px 0 0; color: #475569;">En route to your location (${distanceKm} km away)</p>
          </div>
        `);

      riderMarkerRef.current = riderMarker;

      // Auto-fit bounds around the route with breathing room
      const bounds = L.latLngBounds(routePoints);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });

      setIsMapReady(true);
    }

    initLeafletMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [homeLat, homeLng, storeLat, storeLng, storeName, destinationAddress, riderName, routePoints]);

  // 4. Update Rider Marker and Dashed Route Line as progress increments
  useEffect(() => {
    if (!isMapReady || !riderMarkerRef.current || !mapInstanceRef.current) return;

    const riderPos = getPointAtProgress(currentProgress);
    const newLatLng = [riderPos.lat, riderPos.lng] as [number, number];

    // Smoothly update marker coordinates
    riderMarkerRef.current.setLatLng(newLatLng);

    // Update Dashed Route line from current rider position to destination
    if (dashedRouteRef.current) {
      const remainingPath = [
        newLatLng,
        ...routePoints.slice(riderPos.index + 1),
      ];
      dashedRouteRef.current.setLatLngs(remainingPath);
    }
  }, [currentProgress, isMapReady, routePoints]);

  // Recenter Action Handler (Triggered by compass button in top-right)
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.fitBounds(routePoints as any, { padding: [50, 50], maxZoom: 16 });
  };

  return (
    <div className="relative w-full h-[280px] sm:h-[360px] overflow-hidden bg-[#eef2ec]">
      {/* Top Green Accent Stripe (as seen in screenshot) */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#18A818] z-20" />

      {/* Real Interactive Leaflet Street Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Compass / Recenter Button (Top Right as in screenshot) */}
      <div className="absolute top-3.5 right-3.5 z-10 sm:top-4 sm:right-4">
        <button
          type="button"
          onClick={handleRecenter}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md text-zinc-700 hover:text-zinc-950 transition-all cursor-pointer hover:scale-105 active:scale-95 border border-zinc-200/50"
          title="Recenter Map View"
          aria-label="Recenter map"
        >
          {/* Compass Arrow Icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <polygon points="12 3 18 19 12 15 6 19 12 3" fill="#111827" stroke="#111827" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Floating ETA Badge (Top Left) */}
      <div className="absolute left-3.5 top-3.5 z-10 flex items-center gap-3 rounded-2xl bg-white px-3.5 py-2 shadow-md ring-1 ring-black/5 sm:left-4 sm:top-4 backdrop-blur-xs">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-2xs">
          <Clock className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <p className="text-[10px] text-zinc-500 font-normal">Arriving in</p>
          <p className="text-sm sm:text-base text-zinc-900 font-normal">
            {etaMins} <span className="text-xs text-zinc-500">mins</span>
          </p>
        </div>
      </div>

      {/* Floating Distance Chip (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs text-zinc-800 shadow-md ring-1 ring-black/5 sm:bottom-4 sm:left-4">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--primary)] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--primary)]" />
        </span>
        <span className="font-normal">{riderName} is {distanceKm} km away</span>
      </div>

      {/* Subtle Map Attribution Watermark (Bottom Left behind chip) */}
      <div className="absolute bottom-1 right-3 z-10 pointer-events-none select-none opacity-60">
        <span className="text-[10px] font-normal text-zinc-400">Map data © OpenStreetMap / CartoDB</span>
      </div>
    </div>
  );
}
