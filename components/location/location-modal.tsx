"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import {
  MapPin,
  Navigation,
  Search,
  Building,
  Home,
  Loader2,
  X,
  Compass,
  CheckCircle2,
  Edit3,
  Store,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  isLocationModalOpenAtom,
  persistentLocationAtom,
  hasUserSetLocationAtom,
} from "@/stores";
import { DeliveryLocation } from "@/types/location";
import { resolveDeliveryStoreApi, ResolvedStoreData } from "@/queries/location/use-geocode-query";
import { toast } from "sonner";

export function LocationModal() {
  const [isOpen, setIsOpen] = useAtom(isLocationModalOpenAtom);
  const [currentLocation, setCurrentLocation] = useAtom(persistentLocationAtom);
  const [, setHasUserSetLocation] = useAtom(hasUserSetLocationAtom);

  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DeliveryLocation[]>([]);

  // Local editable form fields matching Blinkit's society details structure
  const [houseNo, setHouseNo] = useState(currentLocation.houseNo || "");
  const [society, setSociety] = useState(currentLocation.society || currentLocation.area || "");
  const [landmark, setLandmark] = useState(currentLocation.landmark || "");
  const [isEditingSociety, setIsEditingSociety] = useState(false);

  // Sync local fields when currentLocation changes
  useEffect(() => {
    setHouseNo(currentLocation.houseNo || "");
    setSociety(currentLocation.society || currentLocation.area || "");
    setLandmark(currentLocation.landmark || "");
  }, [currentLocation]);

  // Search places / pincodes / societies via backend location API & geocode search with debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const cleanQuery = searchQuery.trim();
        const results: DeliveryLocation[] = [];

        // Check backend location API for pincodes and areas
        try {
          const { locationService } = await import("@/services/location-service");
          if (/^\d+$/.test(cleanQuery)) {
            // Pincode search
            const pincodes = await locationService.searchPincodes(cleanQuery);
            if (pincodes && pincodes.length > 0) {
              for (const pin of pincodes) {
                const areas = await locationService.getAreasByPincode(pin.id);
                if (areas && areas.length > 0) {
                  for (const a of areas) {
                    results.push({
                      area: `${a.name}, ${pin.code}`,
                      society: a.name,
                      city: pin.city_name || "Surat",
                      state: "Gujarat",
                      pincode: pin.code,
                      coordinates: {
                        latitude: Number(a.latitude) || 21.1442,
                        longitude: Number(a.longitude) || 72.7712,
                      },
                      deliveryEtaMinutes: 8,
                      isServiceable: true,
                      formattedAddress: `${a.name}, Pincode: ${pin.code}`,
                      rawAreaId: a.id,
                    } as any);
                  }
                } else {
                  results.push({
                    area: `Pincode ${pin.code}`,
                    society: `Pincode ${pin.code}`,
                    city: pin.city_name || "Surat",
                    state: "Gujarat",
                    pincode: pin.code,
                    coordinates: { latitude: 21.1702, longitude: 72.8311 },
                    deliveryEtaMinutes: 10,
                    isServiceable: true,
                    formattedAddress: `Pincode ${pin.code}, Gujarat`,
                  });
                }
              }
            }
          } else {
            // Area name search
            const areas = await locationService.getAreasByPincode(undefined, cleanQuery);
            if (areas && areas.length > 0) {
              for (const a of areas) {
                results.push({
                  area: a.name,
                  society: a.name,
                  city: "Surat",
                  state: "Gujarat",
                  pincode: "395007",
                  coordinates: {
                    latitude: Number(a.latitude) || 21.1442,
                    longitude: Number(a.longitude) || 72.7712,
                  },
                  deliveryEtaMinutes: 8,
                  isServiceable: true,
                  formattedAddress: `${a.name}, Gujarat`,
                  rawAreaId: a.id,
                } as any);
              }
            }
          }
        } catch (apiErr) {
          console.warn("Backend pincode/area search failed:", apiErr);
        }

        // Also query /api/geocode search for Google/Nominatim matching
        try {
          const res = await fetch(
            `/api/geocode?action=search&q=${encodeURIComponent(cleanQuery)}`
          );
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.results)) {
              results.push(...data.results);
            }
          }
        } catch {}

        // Deduplicate results by area
        const seen = new Set<string>();
        const unique = results.filter((r) => {
          const key = (r.area || r.formattedAddress || "").toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setSearchResults(unique);
      } catch (err) {
        console.error("Location search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Construct Blinkit-style display string from components
  const computeBlinkitArea = (hNo: string, soc: string, lmk: string) => {
    const parts: string[] = [];
    if (hNo.trim()) parts.push(hNo.trim());
    if (soc.trim()) parts.push(soc.trim());
    if (lmk.trim()) {
      const cleanLmk = lmk.trim().startsWith("nr.") ? lmk.trim() : `nr. ${lmk.trim()}`;
      parts.push(cleanLmk);
    }
    return parts.length > 0 ? parts.join(", ") : soc.trim() || "Current Location";
  };

  // Handle Real GPS location detection & Reverse Geocoding
  const handleDetectLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let detected: DeliveryLocation | null = null;
        let resolvedStore: ResolvedStoreData | null = null;

        try {
          // Concurrently call backend POST /api/v1/stores/resolve-delivery and reverse-geocode
          const [storeResult, geocodeRes] = await Promise.allSettled([
            resolveDeliveryStoreApi({ latitude, longitude }),
            fetch(`/api/geocode?action=reverse&lat=${latitude}&lng=${longitude}`).then((r) =>
              r.ok ? r.json() : null
            ),
          ]);

          if (storeResult.status === "fulfilled" && storeResult.value) {
            resolvedStore = storeResult.value;
          }

          if (geocodeRes.status === "fulfilled" && geocodeRes.value) {
            detected = geocodeRes.value;
          }
        } catch (apiErr) {
          console.warn("Location or store resolve error:", apiErr);
        }

        // Client-side fallback if server route had issues
        if (!detected || !detected.area) {
          try {
            const fallbackRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (fallbackRes.ok) {
              const bdc = await fallbackRes.json();
              const localityName = bdc.locality || bdc.city || "Current Location";
              const city = bdc.city || bdc.principalSubdivision || "";
              const landmarkStr = city ? `nr. ${city}` : "";
              const areaTitle = localityName && city && localityName !== city
                ? `${localityName}, ${landmarkStr}`
                : localityName;

              detected = {
                area: areaTitle,
                society: localityName,
                houseNo: "",
                landmark: landmarkStr,
                formattedAddress: `${areaTitle}, ${city}, ${bdc.principalSubdivision || ""} ${bdc.postcode || ""}`.trim(),
                city,
                state: bdc.principalSubdivision || "",
                pincode: bdc.postcode || "",
                coordinates: { latitude, longitude },
                deliveryEtaMinutes: 8,
                isServiceable: true,
                darkStoreId: "store-express-01",
                darkStoreName: `${localityName} Express Hub`,
              };
            }
          } catch (fbErr) {
            console.error("Client fallback geocoding failed:", fbErr);
          }
        }

        if (!detected) {
          detected = {
            area: "Detected Location",
            society: "Current Society",
            houseNo: "",
            landmark: "",
            formattedAddress: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
            city: "",
            state: "",
            pincode: "",
            coordinates: { latitude, longitude },
            deliveryEtaMinutes: 8,
            isServiceable: true,
            darkStoreId: "store-express-01",
            darkStoreName: "Express Delivery Hub",
          };
        }

        // Merge resolved store details from POST /api/v1/stores/resolve-delivery
        if (resolvedStore) {
          detected.darkStoreId = resolvedStore.storeId || detected.darkStoreId;
          detected.darkStoreName = resolvedStore.storeName || detected.darkStoreName;
          detected.storeAddress = resolvedStore.storeAddress || detected.storeAddress;
          detected.deliveryEtaMinutes = resolvedStore.deliveryEtaMinutes || detected.deliveryEtaMinutes;
          detected.isServiceable = resolvedStore.isServiceable;
          detected.storeDistanceKm = resolvedStore.distanceKm;
        }

        setCurrentLocation(detected);
        setHouseNo(detected.houseNo || "");
        setSociety(detected.society || detected.area || "");
        setLandmark(detected.landmark || "");
        setHasUserSetLocation(true);
        setIsLocating(false);

        if (detected.isServiceable === false) {
          toast.warning("Notice: Location is currently outside our 10-minute delivery zone.");
        } else {
          toast.success(
            `Delivering to ${detected.society || detected.area} from ${detected.darkStoreName || "Express Store"} in ${detected.deliveryEtaMinutes || 8} mins!`
          );
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please allow location access or search manually.");
        } else if (error.code === error.TIMEOUT) {
          toast.error("Location request timed out. Please try again.");
        } else {
          toast.error("Unable to retrieve GPS location. Please search your society manually.");
        }
      },
      { timeout: 12000, enableHighAccuracy: true, maximumAge: 0 }
    );
  }, [setCurrentLocation, setHasUserSetLocation]);

  const handleSelectSearchResult = async (item: DeliveryLocation) => {
    let updatedItem = { ...item };

    if ((item as any).rawAreaId) {
      try {
        const { locationService } = await import("@/services/location-service");
        const storeRes = await locationService.resolveStoreByArea((item as any).rawAreaId);
        if (storeRes) {
          updatedItem = {
            ...updatedItem,
            darkStoreId: storeRes.storeId || updatedItem.darkStoreId,
            darkStoreName: storeRes.storeName || updatedItem.darkStoreName,
            storeAddress: storeRes.storeAddress || updatedItem.storeAddress,
            deliveryEtaMinutes: storeRes.deliveryEtaMinutes || updatedItem.deliveryEtaMinutes,
            isServiceable: storeRes.isServiceable,
          };
        }
      } catch (err) {
        console.warn("Resolve store by area error:", err);
      }
    } else if (item.coordinates?.latitude && item.coordinates?.longitude) {
      const resolvedStore = await resolveDeliveryStoreApi(item.coordinates);
      if (resolvedStore) {
        updatedItem = {
          ...updatedItem,
          darkStoreId: resolvedStore.storeId || updatedItem.darkStoreId,
          darkStoreName: resolvedStore.storeName || updatedItem.darkStoreName,
          storeAddress: resolvedStore.storeAddress || updatedItem.storeAddress,
          deliveryEtaMinutes: resolvedStore.deliveryEtaMinutes || updatedItem.deliveryEtaMinutes,
          isServiceable: resolvedStore.isServiceable,
          storeDistanceKm: resolvedStore.distanceKm,
        };
      }
    }
    setCurrentLocation(updatedItem);
    setHouseNo(updatedItem.houseNo || "");
    setSociety(updatedItem.society || updatedItem.area || "");
    setLandmark(updatedItem.landmark || "");
    setHasUserSetLocation(true);
    setSearchQuery("");
    setSearchResults([]);
    setIsOpen(false);

    if (updatedItem.isServiceable === false) {
      toast.warning("Notice: This address is currently outside our 10-minute delivery zone.");
    } else {
      toast.success(
        `Delivering to ${updatedItem.area} from ${updatedItem.darkStoreName || "Express Store"} in ${updatedItem.deliveryEtaMinutes || 8} mins!`
      );
    }
  };

  const handleSaveAndConfirm = () => {
    const computedArea = computeBlinkitArea(houseNo, society, landmark);
    const updatedLocation: DeliveryLocation = {
      ...currentLocation,
      area: computedArea,
      society: society.trim(),
      houseNo: houseNo.trim(),
      landmark: landmark.trim(),
      deliveryEtaMinutes: currentLocation.deliveryEtaMinutes || 8,
    };

    setCurrentLocation(updatedLocation);
    setHasUserSetLocation(true);
    setIsOpen(false);
    toast.success(`Delivering to ${computedArea}!`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <div className="p-5 sm:p-6 space-y-4">
          <DialogHeader className="space-y-1.5">
            <div className="flex items-center gap-2 text-[#18A818]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#18A818]/10 text-[#18A818]">
                <MapPin className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-bold text-[var(--text-primary)]">
                Select Your Delivery Location
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-[var(--text-secondary)]">
              Accurate society & doorstep delivery in 8-10 minutes.
            </DialogDescription>
          </DialogHeader>

          {/* GPS Auto-Detect Button */}
          <Button
            onClick={handleDetectLocation}
            disabled={isLocating}
            className="w-full h-11 bg-[#18A818] hover:bg-[#148F14] text-white flex items-center justify-center gap-2.5 font-semibold text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer rounded-xl"
          >
            {isLocating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Detecting exact society & location...</span>
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 fill-white/20" />
                <span>Detect My Current Location</span>
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="relative flex items-center justify-center py-0.5">
            <span className="w-full border-t border-[var(--border)]" />
            <span className="absolute bg-[var(--surface)] px-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Or search society / address
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search society, apartment, building or area..."
              className="pl-9 pr-8 h-10 text-xs bg-[var(--surface-secondary)]/50 border-[var(--border)] focus:bg-[var(--surface)] rounded-xl"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* If Searching: Display Live Address / Society Results */}
          {searchQuery.trim().length > 0 ? (
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1">
                Matching Societies & Locations
              </p>

              {isSearching ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#18A818]" />
                  <span>Searching societies...</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((item, idx) => (
                  <button
                    key={`${item.formattedAddress}-${idx}`}
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-colors cursor-pointer border border-transparent hover:border-[#18A818]/30 hover:bg-[#18A818]/5 group"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface-secondary)] text-[var(--text-muted)] shrink-0 group-hover:text-[#18A818] group-hover:bg-[#18A818]/10 transition-colors mt-0.5">
                      <Building className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[#18A818] truncate">
                        {item.area}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 mt-0.5 leading-snug">
                        {item.formattedAddress}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-5 text-center text-xs text-[var(--text-muted)]">
                  No matching societies found. Try entering area or pincode.
                </div>
              )}
            </div>
          ) : (
            /* When not searching: Display Blinkit-Style Society Details Card */
            <div className="space-y-3 pt-1">
              <div className={`rounded-2xl border ${currentLocation.isServiceable !== false ? "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#202020]" : "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20"} p-4 shadow-xs relative overflow-hidden`}>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`flex h-2 w-2 rounded-full ${currentLocation.isServiceable !== false ? "bg-[#0c831f]" : "bg-amber-500"}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${currentLocation.isServiceable !== false ? "text-[#0c831f]" : "text-amber-600 dark:text-amber-400"}`}>
                      {currentLocation.isServiceable !== false ? "Current Delivery Society" : "Delivery Unavailable"}
                    </span>
                  </div>

                  {currentLocation.isServiceable !== false ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#18A818]/15 px-2.5 py-0.5 text-[10px] font-extrabold text-[#18A818]">
                      ⚡ Delivery in {currentLocation.deliveryEtaMinutes || 8} mins
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                      Outside Delivery Zone
                    </span>
                  )}
                </div>

                {/* Society & Address Display */}
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 mt-0.5 ${currentLocation.isServiceable !== false ? "bg-[#18A818]/15 text-[#18A818]" : "bg-amber-500/15 text-amber-600"}`}>
                      <Home className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-black text-[var(--text-primary)] leading-snug truncate">
                        {computeBlinkitArea(houseNo, society, landmark)}
                      </h4>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-2 leading-relaxed">
                        {currentLocation.formattedAddress}
                      </p>

                      {/* Resolved Dark Store & Distance Badge */}
                      {currentLocation.darkStoreName && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-[var(--border)]/60 text-[11px]">
                          <span className="inline-flex items-center gap-1 font-semibold text-[#18A818] bg-[#18A818]/10 px-2 py-0.5 rounded-md">
                            <Store className="h-3 w-3" />
                            <span>Fulfilled by {currentLocation.darkStoreName}</span>
                          </span>
                          {currentLocation.storeDistanceKm !== undefined && (
                            <span className="text-[10px] text-[var(--text-muted)] font-medium">
                              ({currentLocation.storeDistanceKm.toFixed(1)} km away)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Unserviceable Warning */}
                      {currentLocation.isServiceable === false && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs mt-2">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <span>Our dark stores do not service this location yet. Please select an alternate area.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Toggle to edit/fine-tune flat or society */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingSociety((prev) => !prev)}
                      className="text-[11px] font-semibold text-[#18A818] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>{isEditingSociety ? "Hide flat/society details" : "Add or edit Flat / Society details"}</span>
                    </button>
                  </div>

                  {/* Inline Flat & Society Editor (like Blinkit address refinement) */}
                  {isEditingSociety && (
                    <div className="mt-2.5 pt-2.5 border-t border-[var(--border)] space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                            Shop / Flat No.
                          </label>
                          <Input
                            value={houseNo}
                            onChange={(e) => setHouseNo(e.target.value)}
                            placeholder="e.g. Shop no. 1"
                            className="h-8 text-xs mt-0.5 bg-[var(--surface)]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                            Society / Building
                          </label>
                          <Input
                            value={society}
                            onChange={(e) => setSociety(e.target.value)}
                            placeholder="e.g. Kahan Park"
                            className="h-8 text-xs mt-0.5 bg-[var(--surface)]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                          Landmark (Optional)
                        </label>
                        <Input
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          placeholder="e.g. nr. Varachha"
                          className="h-8 text-xs mt-0.5 bg-[var(--surface)]"
                        />
                      </div>
                    </div>
                  )}

                  {/* City & Coordinates Metadata */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 text-[10px] text-[var(--text-muted)]">
                    {currentLocation.city && (
                      <span className="bg-[var(--surface)] px-2 py-0.5 rounded-md border border-[var(--border)]">
                        City: <strong className="text-[var(--text-secondary)]">{currentLocation.city}</strong>
                      </span>
                    )}
                    {currentLocation.pincode && (
                      <span className="bg-[var(--surface)] px-2 py-0.5 rounded-md border border-[var(--border)]">
                        Pincode: <strong className="text-[var(--text-secondary)]">{currentLocation.pincode}</strong>
                      </span>
                    )}
                    {currentLocation.coordinates && (
                      <span className="bg-[var(--surface)] px-2 py-0.5 rounded-md border border-[var(--border)] flex items-center gap-1">
                        <Compass className="h-3 w-3 text-[#18A818]" />
                        <span>
                          {currentLocation.coordinates.latitude.toFixed(2)}°, {currentLocation.coordinates.longitude.toFixed(2)}°
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Confirm & Deliver Button */}
                <div className="mt-3.5 pt-3 border-t border-[var(--border)]/70">
                  <Button
                    onClick={handleSaveAndConfirm}
                    disabled={currentLocation.isServiceable === false}
                    className="w-full h-10 bg-[#18A818] hover:bg-[#148F14] disabled:bg-gray-400 text-white font-bold text-xs flex items-center justify-center gap-2 rounded-xl cursor-pointer shadow-xs active:scale-[0.99]"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{currentLocation.isServiceable === false ? "Cannot Deliver to this Location" : "Confirm & Deliver to This Society"}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Hub Info */}
        <div className="bg-[var(--surface-secondary)] px-5 py-2.5 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5 truncate max-w-[240px]">
            <span className={`h-1.5 w-1.5 rounded-full ${currentLocation.isServiceable !== false ? "bg-[#18A818]" : "bg-amber-500"}`} />
            <span className="truncate">Hub: {currentLocation.darkStoreName || "Express Dark Store"}</span>
          </span>
          <span className={`font-extrabold shrink-0 ${currentLocation.isServiceable !== false ? "text-[#18A818]" : "text-amber-600 dark:text-amber-400"}`}>
            {currentLocation.isServiceable !== false ? `⚡ ${currentLocation.deliveryEtaMinutes || 8} mins delivery` : "Unserviceable"}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
