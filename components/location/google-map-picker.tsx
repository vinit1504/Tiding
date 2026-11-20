"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin,
  Navigation,
  Loader2,
  Search,
  Plus,
  Minus,
  Crosshair,
  AlertCircle,
  X,
  Compass,
} from "lucide-react";
import { GeoCoordinates, LocationSource } from "@/types/location";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";

export interface GoogleMapPickerProps {
  coordinates: GeoCoordinates;
  accuracyMeters?: number;
  locationSource?: LocationSource;
  onCoordinatesChange: (coords: GeoCoordinates, source: LocationSource) => void;
  onDetectLocation?: () => void;
  isDetectingGPS?: boolean;
  className?: string;
  enableSearch?: boolean;
}

export function GoogleMapPicker({
  coordinates,
  accuracyMeters,
  locationSource = "manual_pin",
  onCoordinatesChange,
  onDetectLocation,
  isDetectingGPS = false,
  className = "w-full h-full min-h-[350px]",
  enableSearch = true,
}: GoogleMapPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [mapEngine, setMapEngine] = useState<"google" | "fallback" | "loading">("loading");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Google Maps Instance references
  const googleMapRef = useRef<any>(null);
  const googleMarkerRef = useRef<any>(null);
  const googleCircleRef = useRef<any>(null);
  const googleAutocompleteRef = useRef<any>(null);

  // Fallback Leaflet Instance references
  const leafletMapRef = useRef<any>(null);
  const leafletMarkerRef = useRef<any>(null);
  const leafletCircleRef = useRef<any>(null);

  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // -------------------------------------------------------------
  // Google Maps Script Loader
  // -------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function loadGoogleMaps() {
      // If window.google.maps is already available
      if (typeof window !== "undefined" && window.google?.maps) {
        if (isMounted) setMapEngine("google");
        return;
      }

      // If no Google Maps API key is configured, fallback safely to Leaflet
      if (!googleApiKey) {
        if (isMounted) setMapEngine("fallback");
        return;
      }

      // Check if script is already present in document
      const existingScript = document.getElementById("google-maps-js-sdk");
      if (existingScript) {
        existingScript.addEventListener("load", () => {
          if (isMounted && window.google?.maps) setMapEngine("google");
        });
        existingScript.addEventListener("error", () => {
          if (isMounted) setMapEngine("fallback");
        });
        return;
      }

      try {
        const script = document.createElement("script");
        script.id = "google-maps-js-sdk";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted && window.google?.maps) {
            setMapEngine("google");
          } else if (isMounted) {
            setMapEngine("fallback");
          }
        };
        script.onerror = () => {
          if (isMounted) {
            console.warn("[GoogleMapPicker] Google Maps SDK failed to load; using fallback map.");
            setMapEngine("fallback");
          }
        };
        document.head.appendChild(script);
      } catch (err) {
        if (isMounted) setMapEngine("fallback");
      }
    }

    loadGoogleMaps();

    return () => {
      isMounted = false;
    };
  }, [googleApiKey]);

  // -------------------------------------------------------------
  // Initialize Google Maps Engine
  // -------------------------------------------------------------
  useEffect(() => {
    if (mapEngine !== "google" || !containerRef.current || !window.google?.maps) return;

    const mapOptions = {
      center: { lat: coordinates.latitude, lng: coordinates.longitude },
      zoom: 16,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false, // We render custom responsive zoom buttons
      gestureHandling: "greedy",
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "on" }],
        },
      ],
    };

    const map = new window.google.maps.Map(containerRef.current, mapOptions);
    googleMapRef.current = map;

    // Draggable Marker
    const marker = new window.google.maps.Marker({
      position: { lat: coordinates.latitude, lng: coordinates.longitude },
      map,
      draggable: true,
      title: "Delivery Location (Drag to adjust)",
      animation: window.google.maps.Animation.DROP,
    });
    googleMarkerRef.current = marker;

    // Accuracy Circle
    if (accuracyMeters && accuracyMeters > 0) {
      const circle = new window.google.maps.Circle({
        strokeColor: "#0c831f",
        strokeOpacity: 0.6,
        strokeWeight: 1.5,
        fillColor: "#0c831f",
        fillOpacity: 0.12,
        map,
        center: { lat: coordinates.latitude, lng: coordinates.longitude },
        radius: Math.min(accuracyMeters, 1500),
      });
      googleCircleRef.current = circle;
    }

    // Marker Drag Events
    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      if (!pos) return;
      const newLat = pos.lat();
      const newLng = pos.lng();
      if (googleCircleRef.current) {
        googleCircleRef.current.setCenter({ lat: newLat, lng: newLng });
      }
      onCoordinatesChange({ latitude: newLat, longitude: newLng }, "manual_pin");
    });

    // Map Click to reposition marker
    map.addListener("click", (e: any) => {
      if (!e.latLng) return;
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      marker.setPosition({ lat: newLat, lng: newLng });
      if (googleCircleRef.current) {
        googleCircleRef.current.setCenter({ lat: newLat, lng: newLng });
      }
      onCoordinatesChange({ latitude: newLat, longitude: newLng }, "manual_pin");
    });

    // Places Autocomplete
    if (searchInputRef.current && window.google.maps.places) {
      try {
        const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
          fields: ["geometry", "formatted_address", "name"],
        });
        autocomplete.bindTo("bounds", map);
        googleAutocompleteRef.current = autocomplete;

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) {
            toast.error("Place details not found. Please try another search term.");
            return;
          }

          const newLat = place.geometry.location.lat();
          const newLng = place.geometry.location.lng();

          map.setCenter({ lat: newLat, lng: newLng });
          map.setZoom(17);
          marker.setPosition({ lat: newLat, lng: newLng });
          if (googleCircleRef.current) {
            googleCircleRef.current.setCenter({ lat: newLat, lng: newLng });
          }

          onCoordinatesChange({ latitude: newLat, longitude: newLng }, "place_search");
        });
      } catch (err) {
        console.warn("[GoogleMapPicker] Autocomplete initialization error:", err);
      }
    }

    return () => {
      if (googleMarkerRef.current) {
        googleMarkerRef.current.setMap(null);
      }
      if (googleCircleRef.current) {
        googleCircleRef.current.setMap(null);
      }
    };
  }, [mapEngine]);

  // -------------------------------------------------------------
  // Initialize Fallback Leaflet Map Engine
  // -------------------------------------------------------------
  useEffect(() => {
    if (mapEngine !== "fallback" || !containerRef.current) return;
    let isMounted = true;
    let L: any = null;

    async function initLeaflet() {
      if (typeof window === "undefined" || !containerRef.current) return;
      L = await import("leaflet");
      if (!isMounted || !containerRef.current) return;

      // Fix Leaflet icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const customPinIcon = L.divIcon({
        className: "custom-delivery-pin",
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

      const map = L.map(containerRef.current, {
        center: [coordinates.latitude, coordinates.longitude],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });
      leafletMapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        subdomains: ["a", "b", "c"],
      }).addTo(map);

      // Draggable marker
      const marker = L.marker([coordinates.latitude, coordinates.longitude], {
        icon: customPinIcon,
        draggable: true,
      }).addTo(map);
      leafletMarkerRef.current = marker;

      // Accuracy circle
      if (accuracyMeters && accuracyMeters > 0) {
        const circle = L.circle([coordinates.latitude, coordinates.longitude], {
          radius: Math.min(accuracyMeters, 1500),
          color: "#0c831f",
          fillColor: "#0c831f",
          fillOpacity: 0.12,
          weight: 1.5,
        }).addTo(map);
        leafletCircleRef.current = circle;
      }

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        if (leafletCircleRef.current) {
          leafletCircleRef.current.setLatLng(pos);
        }
        onCoordinatesChange({ latitude: pos.lat, longitude: pos.lng }, "manual_pin");
      });

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        if (leafletCircleRef.current) {
          leafletCircleRef.current.setLatLng([lat, lng]);
        }
        map.panTo([lat, lng], { animate: true, duration: 0.5 });
        onCoordinatesChange({ latitude: lat, longitude: lng }, "manual_pin");
      });
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        leafletMarkerRef.current = null;
        leafletCircleRef.current = null;
      }
    };
  }, [mapEngine]);

  // -------------------------------------------------------------
  // Synchronize External Coordinates to Active Map Engine
  // -------------------------------------------------------------
  useEffect(() => {
    if (!coordinates.latitude || !coordinates.longitude) return;

    if (mapEngine === "google" && googleMapRef.current && googleMarkerRef.current) {
      const pos = { lat: coordinates.latitude, lng: coordinates.longitude };
      googleMapRef.current.panTo(pos);
      googleMarkerRef.current.setPosition(pos);
      if (googleCircleRef.current) {
        googleCircleRef.current.setCenter(pos);
        if (accuracyMeters) {
          googleCircleRef.current.setRadius(Math.min(accuracyMeters, 1500));
        }
      }
    } else if (mapEngine === "fallback" && leafletMapRef.current && leafletMarkerRef.current) {
      const latlng = [coordinates.latitude, coordinates.longitude];
      leafletMapRef.current.setView(latlng, leafletMapRef.current.getZoom(), { animate: true });
      leafletMarkerRef.current.setLatLng(latlng);
      if (leafletCircleRef.current) {
        leafletCircleRef.current.setLatLng(latlng);
        if (accuracyMeters) {
          leafletCircleRef.current.setRadius(Math.min(accuracyMeters, 1500));
        }
      }
    }
  }, [coordinates.latitude, coordinates.longitude, accuracyMeters, mapEngine]);

  // -------------------------------------------------------------
  // Zoom Controls
  // -------------------------------------------------------------
  const handleZoomIn = () => {
    if (mapEngine === "google" && googleMapRef.current) {
      googleMapRef.current.setZoom((googleMapRef.current.getZoom() || 16) + 1);
    } else if (mapEngine === "fallback" && leafletMapRef.current) {
      leafletMapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapEngine === "google" && googleMapRef.current) {
      googleMapRef.current.setZoom((googleMapRef.current.getZoom() || 16) - 1);
    } else if (mapEngine === "fallback" && leafletMapRef.current) {
      leafletMapRef.current.zoomOut();
    }
  };

  // -------------------------------------------------------------
  // Fallback Search Handler
  // -------------------------------------------------------------
  const handlePerformFallbackSearch = async (queryText: string) => {
    if (!queryText.trim() || queryText.length < 3) return;
    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(queryText.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (item: any) => {
    const lat = item.coordinates?.latitude || parseFloat(item.lat);
    const lng = item.coordinates?.longitude || parseFloat(item.lon);
    if (!lat || !lng) return;

    setShowSearchResults(false);
    setSearchQuery(item.formattedAddress || item.area || "");

    if (mapEngine === "google" && googleMapRef.current && googleMarkerRef.current) {
      googleMapRef.current.setCenter({ lat, lng });
      googleMapRef.current.setZoom(17);
      googleMarkerRef.current.setPosition({ lat, lng });
    } else if (mapEngine === "fallback" && leafletMapRef.current && leafletMarkerRef.current) {
      leafletMapRef.current.setView([lat, lng], 17, { animate: true });
      leafletMarkerRef.current.setLatLng([lat, lng]);
    }

    onCoordinatesChange({ latitude: lat, longitude: lng }, "place_search");
  };

  return (
    <div className={`relative ${className} overflow-hidden rounded-2xl border border-[var(--border)] bg-neutral-100 dark:bg-neutral-900`}>
      {/* Search Bar on Map */}
      {enableSearch && (
        <div className="absolute top-3 left-3 right-3 z-20 max-w-md mx-auto">
          <div className="relative flex items-center bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-[var(--border)] overflow-hidden">
            <Search className="h-4 w-4 ml-3 text-neutral-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (mapEngine === "fallback") {
                  handlePerformFallbackSearch(e.target.value);
                }
              }}
              onFocus={() => {
                if (searchResults.length > 0) setShowSearchResults(true);
              }}
              placeholder="Search apartment, society, street or place..."
              className="w-full py-2.5 px-3 text-xs sm:text-sm bg-transparent outline-none text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400"
            />
            {isSearching && (
              <Loader2 className="h-4 w-4 mr-3 text-[#0c831f] animate-spin shrink-0" />
            )}
            {searchQuery && !isSearching && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchResults(false);
                }}
                className="p-1 mr-2 text-neutral-400 hover:text-neutral-600 rounded-md"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Fallback Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-[var(--border)] overflow-hidden max-h-56 overflow-y-auto divide-y divide-[var(--border)]">
              {searchResults.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left p-3 hover:bg-emerald-50 dark:hover:bg-neutral-700/60 transition-colors flex items-start gap-2.5"
                >
                  <MapPin className="h-4 w-4 text-[#0c831f] mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {item.society || item.area || item.formattedAddress?.split(",")[0]}
                    </p>
                    <p className="text-[11px] text-neutral-500 truncate">
                      {item.formattedAddress}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Guide Banner Overlay */}
      <div className="absolute top-16 left-3 right-3 z-10 flex items-center justify-center pointer-events-none">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-medium shadow-lg animate-in fade-in slide-in-from-top-2">
          <MapPin className="h-3 w-3 text-emerald-400 animate-bounce" />
          <span>Move marker or click anywhere to pinpoint your exact doorstep</span>
        </div>
      </div>

      {/* Real Map Container */}
      <div ref={containerRef} className="w-full h-full min-h-[350px] z-0" />

      {/* Loading state indicator */}
      {mapEngine === "loading" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-100/90 dark:bg-neutral-900/90 backdrop-blur-xs">
          <Loader2 className="h-7 w-7 text-[#0c831f] animate-spin mb-2" />
          <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
            Initializing Live Map...
          </span>
        </div>
      )}

      {/* Floating Map Controls (Right Side) */}
      <div className="absolute right-3 bottom-4 z-10 flex flex-col items-center gap-2">
        {/* Current Location / GPS Button */}
        {onDetectLocation && (
          <button
            type="button"
            onClick={onDetectLocation}
            disabled={isDetectingGPS}
            title="Detect My Location"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 shadow-xl border border-[var(--border)] hover:bg-neutral-50 dark:hover:bg-neutral-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {isDetectingGPS ? (
              <Loader2 className="h-5 w-5 text-[#0c831f] animate-spin" />
            ) : (
              <Navigation className="h-5 w-5 text-[#0c831f]" />
            )}
          </button>
        )}

        {/* Zoom Controls */}
        <div className="flex flex-col bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-[var(--border)] overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="flex h-9 w-9 items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 border-b border-[var(--border)] active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="flex h-9 w-9 items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 active:scale-95 transition-all"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Lat / Lng Footer Pill */}
      <div className="absolute left-3 bottom-3 z-10 pointer-events-none">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white/90">
          <Crosshair className="h-2.5 w-2.5 text-emerald-400" />
          <span>
            {coordinates.latitude.toFixed(5)}°, {coordinates.longitude.toFixed(5)}°
          </span>
        </div>
      </div>
    </div>
  );
}
