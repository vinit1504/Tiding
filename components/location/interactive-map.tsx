"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Navigation,
  Loader2,
  Compass,
  Layers,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export interface MapLocationResult {
  coordinates: { latitude: number; longitude: number };
  formattedAddress: string;
  society?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  darkStoreName?: string;
  deliveryEtaMinutes?: number;
}

interface InteractiveMapProps {
  initialCoordinates?: { latitude: number; longitude: number };
  onLocationSelect?: (result: MapLocationResult) => void;
  className?: string;
}

export default function InteractiveMap({
  initialCoordinates = { latitude: 21.1702, longitude: 72.8311 },
  onLocationSelect,
  className = "w-full h-full",
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  const [coords, setCoords] = useState(initialCoordinates);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [liveLocationInfo, setLiveLocationInfo] =
    useState<MapLocationResult | null>(null);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);

  // Reverse geocode a coordinate via /api/geocode
  const handleReverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      setIsReverseGeocoding(true);
      try {
        const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
        if (res.ok) {
          const data = await res.json();
          // Extract 6-digit pincode from formattedAddress if not directly returned
          let resolvedPincode = data.pincode || "";
          if (!resolvedPincode && data.formattedAddress) {
            const pinMatch = data.formattedAddress.match(/\b([1-9][0-9]{5})\b/);
            if (pinMatch) resolvedPincode = pinMatch[1];
          }

          const locationResult: MapLocationResult = {
            coordinates: { latitude: lat, longitude: lng },
            formattedAddress: data.formattedAddress || "",
            society: data.society || data.area || "",
            area: data.area || data.society || "",
            city: data.city || "",
            state: data.state || "",
            pincode: resolvedPincode,
            darkStoreName: data.darkStoreName || "",
            deliveryEtaMinutes: data.deliveryEtaMinutes || 0,
          };

          setLiveLocationInfo(locationResult);
          if (onLocationSelect) {
            onLocationSelect(locationResult);
          }
        }
      } catch (err) {
        console.warn("Reverse geocode failed:", err);
      } finally {
        setIsReverseGeocoding(false);
      }
    },
    [onLocationSelect],
  );

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;
    let L: any = null;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      L = await import("leaflet");

      if (!isMounted || !mapContainerRef.current) return;

      // Fix default Leaflet icon paths in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Custom high-contrast Blinkit-style delivery marker
      const customPinIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(12, 131, 31, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 34px; height: 34px; border-radius: 50%; background: #0c831f; border: 2.5px solid #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      // Create map instance
      const map = L.map(mapContainerRef.current, {
        center: [coords.latitude, coords.longitude],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // Standard official OpenStreetMap (OSM) tile layer - simple, free, and reliable
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        subdomains: ["a", "b", "c"],
      }).addTo(map);

      // Create Draggable Pin Marker
      const marker = L.marker([coords.latitude, coords.longitude], {
        icon: customPinIcon,
        draggable: true,
      }).addTo(map);

      markerInstanceRef.current = marker;

      // When marker is dragged
      marker.on("dragend", () => {
        const position = marker.getLatLng();
        setCoords({ latitude: position.lat, longitude: position.lng });
        handleReverseGeocode(position.lat, position.lng);
      });

      // When user clicks anywhere on map
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCoords({ latitude: lat, longitude: lng });
        map.panTo([lat, lng], { animate: true, duration: 0.5 });
        handleReverseGeocode(lat, lng);
      });

      // Initial reverse geocode for current coordinates
      handleReverseGeocode(coords.latitude, coords.longitude);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position when external coords change
  useEffect(() => {
    if (
      initialCoordinates &&
      (initialCoordinates.latitude !== coords.latitude ||
        initialCoordinates.longitude !== coords.longitude)
    ) {
      setCoords(initialCoordinates);
      if (mapInstanceRef.current && markerInstanceRef.current) {
        mapInstanceRef.current.setView(
          [initialCoordinates.latitude, initialCoordinates.longitude],
          16,
          { animate: true },
        );
        markerInstanceRef.current.setLatLng([
          initialCoordinates.latitude,
          initialCoordinates.longitude,
        ]);
        handleReverseGeocode(
          initialCoordinates.latitude,
          initialCoordinates.longitude,
        );
      }
    }
  }, [initialCoordinates.latitude, initialCoordinates.longitude]);

  // Center on Device GPS
  const handleLocateMe = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingGPS(false);
        const { latitude, longitude } = pos.coords;
        setCoords({ latitude, longitude });

        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 17, {
            animate: true,
            duration: 0.8,
          });
          markerInstanceRef.current.setLatLng([latitude, longitude]);
        }
        handleReverseGeocode(latitude, longitude);
        toast.success("Location locked successfully!");
      },
      (err) => {
        setIsLocatingGPS(false);
        toast.error("Failed to detect GPS. Please click on the map to pin.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className={`relative ${className} overflow-hidden rounded-xl`}>
      {/* Real Map Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px] z-0" />

      {/* Top Banner: Tap map to pin guidance */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md shadow-md border border-neutral-200/80 dark:border-neutral-700 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 pointer-events-auto">
          <MapPin className="h-3.5 w-3.5 text-[#0c831f] shrink-0 animate-bounce" />
          <span>Click anywhere to adjust pin</span>
        </div>

        {/* GPS Locate Me Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocatingGPS}
          title="Detect Current Location"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0c831f] text-white hover:bg-[#0a6c1a] shadow-lg transition-transform active:scale-95 cursor-pointer text-[11px] font-bold pointer-events-auto"
        >
          {isLocatingGPS ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Navigation className="h-3.5 w-3.5" />
          )}
          <span>Locate Me</span>
        </button>
      </div>

      {/* Floating Bottom Card: Real-time Reverse Geocode Address Preview */}
      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-auto">
        <div className="p-3 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-xl border border-neutral-200/90 dark:border-neutral-800 transition-all">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                {isReverseGeocoding ? (
                  <Loader2 className="h-4 w-4 text-[#0c831f] animate-spin" />
                ) : (
                  <Compass className="h-4 w-4 text-[#0c831f]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                    {liveLocationInfo?.society ||
                      liveLocationInfo?.area ||
                      "Pin Location"}
                  </h4>
                  {liveLocationInfo?.pincode && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {liveLocationInfo.pincode}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                  {liveLocationInfo?.formattedAddress ||
                    `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Coordinate & Dark Store Pilli */}
          <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
            <span className="truncate">
              📍 {coords.latitude.toFixed(4)}° N, {coords.longitude.toFixed(4)}°
              E
            </span>
            {liveLocationInfo?.darkStoreName ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                ⚡ {liveLocationInfo.darkStoreName}
                {liveLocationInfo.deliveryEtaMinutes
                  ? ` (~${liveLocationInfo.deliveryEtaMinutes}m)`
                  : ""}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
