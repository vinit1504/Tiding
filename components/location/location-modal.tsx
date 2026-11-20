"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Navigation,
  Loader2,
  Check,
  CheckCircle2,
  AlertTriangle,
  Home,
  Briefcase,
  Plus,
  Zap,
  Store,
  Phone,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  isLocationModalOpenAtom,
  persistentLocationAtom,
  hasUserSetLocationAtom,
  isAuthDrawerOpenAtom,
  userProfileAtom,
  authSessionAtom,
} from "@/stores";
import {
  DeliveryLocation,
  GeoCoordinates,
  LocationSource,
  ReverseGeocodeResult,
  getAccuracyInfo,
} from "@/types/location";
import { CustomerAddress } from "@/types/address";
import { useCustomerAddressesQuery, useCreateAddressMutation } from "@/queries";
import { QUERY_KEYS } from "@/queries/query-keys";
import { resolveDeliveryStoreApi, ResolvedStoreData } from "@/queries/location/use-geocode-query";
import { useQueryClient } from "@tanstack/react-query";
import { locationService } from "@/lib/api/location-service";
import { toast } from "sonner";
import { AddressModal } from "../account";
import { GoogleMapPicker } from "./google-map-picker";
import { AccuracyIndicator } from "./accuracy-indicator";
import { useCustomerGeolocation } from "@/hooks/use-customer-geolocation";

export function LocationModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useAtom(isLocationModalOpenAtom);
  const [currentLocation, setCurrentLocation] = useAtom(persistentLocationAtom);
  const [, setHasUserSetLocation] = useAtom(hasUserSetLocationAtom);

  const [user, setUser] = useAtom(userProfileAtom);
  const [session] = useAtom(authSessionAtom);
  const [, setIsAuthDrawerOpen] = useAtom(isAuthDrawerOpenAtom);

  // Active Map Coordinates & Accuracy
  const [activeCoords, setActiveCoords] = useState<GeoCoordinates>(
    currentLocation.coordinates || { latitude: 21.1702, longitude: 72.8311 }
  );
  const [activeAccuracy, setActiveAccuracy] = useState<number>(currentLocation.accuracy || 25);
  const [activeSource, setActiveSource] = useState<LocationSource>(
    currentLocation.locationSource || "manual_pin"
  );

  // Address Preview details retrieved dynamically from reverse geocoding
  const [addressDetails, setAddressDetails] = useState<Partial<ReverseGeocodeResult>>({
    fullAddress: currentLocation.formattedAddress || "",
    street: currentLocation.street || currentLocation.houseNo || "",
    road: currentLocation.road || "",
    locality: currentLocation.locality || currentLocation.area || "",
    area: currentLocation.area || "",
    city: currentLocation.city || "",
    state: currentLocation.state || "",
    country: currentLocation.country || "India",
    postalCode: currentLocation.postalCode || currentLocation.pincode || "",
  });

  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [storeInfo, setStoreInfo] = useState<ResolvedStoreData | null>(null);
  const [isConfirmingLocation, setIsConfirmingLocation] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "saved">("map");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // Hook for browser geolocation with exact options
  const { isDetecting, detectLocation } = useCustomerGeolocation();

  const createAddressMutation = useCreateAddressMutation();
  const { data: serverSavedAddresses = [], isLoading: isLoadingAddresses } = useCustomerAddressesQuery();
  const isAuthenticated = !!user || session.isAuthenticated;

  // Saved addresses list
  const savedAddresses: CustomerAddress[] = useMemo(() => {
    if (serverSavedAddresses && serverSavedAddresses.length > 0) {
      return serverSavedAddresses;
    }
    if (user?.savedAddresses && user.savedAddresses.length > 0) {
      return user.savedAddresses.map((addr) => ({
        id: addr.id,
        address_type: (addr.type?.toUpperCase() === "WORK" ? "WORK" : "HOME") as any,
        recipient_name: addr.receiverName || user?.name || "Customer",
        recipient_phone: addr.receiverPhone || user?.phone || "",
        address_line_1: addr.addressLine || "",
        address_line_2: addr.area || null,
        landmark: addr.landmark || null,
        area_name: addr.area,
        city_name: addr.city,
        pincode: addr.pincode,
        latitude: addr.coordinates?.latitude ? String(addr.coordinates.latitude) : null,
        longitude: addr.coordinates?.longitude ? String(addr.coordinates.longitude) : null,
        is_default: !!addr.isDefault,
        area_id: "feacf6d2-53e1-40de-af4e-ddc1404c0fb7",
        city_id: "e4f80d05-6ce3-40c3-9d12-3ad6dc29bac9",
        state_id: "05efa890-b84c-44ed-b312-9ba531814aeb",
        country_id: "bb1942fd-ab4f-48a9-999f-6cebcd644e68",
      }));
    }
    return [];
  }, [serverSavedAddresses, user]);

  // Synchronize when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (currentLocation.coordinates) {
        setActiveCoords(currentLocation.coordinates);
      }
      if (currentLocation.accuracy) {
        setActiveAccuracy(currentLocation.accuracy);
      }
      if (currentLocation.locationSource) {
        setActiveSource(currentLocation.locationSource);
      }
      setViewMode("map");
    }
  }, [isOpen, currentLocation]);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic Reverse Geocode function (never hardcodes addresses)
  const fetchReverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      setIsReverseGeocoding(true);
      try {
        const result = await locationService.reverseGeocode(lat, lng);
        if (result) {
          setAddressDetails({
            fullAddress: result.fullAddress,
            street: result.street,
            road: result.road,
            locality: result.locality,
            area: result.area,
            city: result.city,
            state: result.state,
            country: result.country,
            postalCode: result.postalCode,
            darkStoreName: result.darkStoreName,
            deliveryEtaMinutes: result.deliveryEtaMinutes,
            isServiceable: result.isServiceable,
          });
        }
        // Resolve the serving dark store for real ETA / distance / serviceability
        try {
          const store = await resolveDeliveryStoreApi({ latitude: lat, longitude: lng });
          setStoreInfo(store);
        } catch {
          setStoreInfo(null);
        }
      } catch (err) {
        console.warn("Reverse geocode failed:", err);
      } finally {
        setIsReverseGeocoding(false);
      }
    },
    []
  );

  // Trigger initial reverse geocoding if opened without full address
  useEffect(() => {
    if (isOpen && activeCoords.latitude && activeCoords.longitude && !addressDetails.fullAddress) {
      fetchReverseGeocode(activeCoords.latitude, activeCoords.longitude);
    }
  }, [isOpen, activeCoords, addressDetails.fullAddress, fetchReverseGeocode]);

  // Handle coordinates changed via Map (pin drag, click, search) with 400ms debounce
  const handleCoordinatesChange = useCallback(
    (newCoords: GeoCoordinates, source: LocationSource) => {
      setActiveCoords(newCoords);
      const effectiveSource: LocationSource =
        source === "ip_location" ? "manual_map_selection" : source;
      setActiveSource(effectiveSource);

      if (
        effectiveSource === "manual_pin" ||
        effectiveSource === "manual_map_selection" ||
        effectiveSource === "place_search"
      ) {
        setActiveAccuracy(15);
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        fetchReverseGeocode(newCoords.latitude, newCoords.longitude);
      }, 400);
    },
    [fetchReverseGeocode]
  );

  // IP fallback if GPS is blocked or unavailable
  const handleFallbackToIP = useCallback(async () => {
    try {
      const data = await locationService.ipLookup();
      if (data) {
        const coords = { latitude: data.latitude, longitude: data.longitude };
        setActiveCoords(coords);
        setActiveAccuracy(data.accuracy || 2500);
        setActiveSource("ip_location");
        setAddressDetails({
          fullAddress: `${data.city}, ${data.region}`,
          city: data.city,
          state: data.region,
          country: data.country || "India",
          postalCode: data.postalCode,
          street: undefined,
          locality: undefined,
        });
        toast.info(`We found you near ${data.city}. Please confirm your exact building on the map.`);
      }
    } catch {
      toast.info("Please drag the pin to select your delivery location.");
    }
  }, []);

  // Handle GPS detection button click with automatic IP fallback
  const handleDetectGPS = useCallback(() => {
    detectLocation({
      onSuccess: (result) => {
        const coords = { latitude: result.latitude, longitude: result.longitude };
        setActiveCoords(coords);
        setActiveAccuracy(result.accuracy);
        setActiveSource(result.locationSource);
        fetchReverseGeocode(coords.latitude, coords.longitude);
        toast.success(`Location detected (±${result.accuracy}m). Please review the pin.`);
      },
      onError: () => {
        // If GPS permission denied or times out, seamlessly fallback to IP lookup
        handleFallbackToIP();
      },
    });
  }, [detectLocation, fetchReverseGeocode, handleFallbackToIP]);

  // Handle Confirm Delivery Location
  const handleConfirmLocation = useCallback(async () => {
    setIsConfirmingLocation(true);
    try {
      // 1. Backend Integration: POST /api/locations
      await locationService.saveLocation({
        latitude: activeCoords.latitude,
        longitude: activeCoords.longitude,
        accuracy: activeAccuracy,
        locationSource: activeSource,
        isUserConfirmed: true,
        addressDetails,
      });

      // 2. Resolve dark store fulfillment
      let resolvedStore: ResolvedStoreData | null = null;
      try {
        resolvedStore = await resolveDeliveryStoreApi({
          latitude: activeCoords.latitude,
          longitude: activeCoords.longitude,
        });
      } catch (err) {
        console.warn("Resolve store notice:", err);
      }

      // 3. Construct Confirmed DeliveryLocation
      const confirmedLocation: DeliveryLocation = {
        ...currentLocation,
        coordinates: activeCoords,
        accuracy: activeAccuracy,
        locationSource: activeSource,
        formattedAddress: addressDetails.fullAddress || `${activeCoords.latitude.toFixed(4)}, ${activeCoords.longitude.toFixed(4)}`,
        street: addressDetails.street,
        road: addressDetails.road,
        locality: addressDetails.locality,
        area: addressDetails.area || addressDetails.locality || "Confirmed Location",
        city: addressDetails.city || currentLocation.city || "",
        state: addressDetails.state || currentLocation.state || "",
        country: addressDetails.country || "India",
        pincode: addressDetails.postalCode || currentLocation.pincode || "",
        postalCode: addressDetails.postalCode,
        darkStoreId: resolvedStore?.storeId || addressDetails.darkStoreId || currentLocation.darkStoreId,
        darkStoreName: resolvedStore?.storeName || addressDetails.darkStoreName || currentLocation.darkStoreName || "Express Dark Store",
        deliveryEtaMinutes: resolvedStore?.deliveryEtaMinutes || addressDetails.deliveryEtaMinutes || 10,
        isServiceable: resolvedStore?.isServiceable ?? addressDetails.isServiceable ?? true,
        storeDistanceKm: resolvedStore?.distanceKm,
      };

      // 4. Save to persistent atom & invalidate catalogs
      setCurrentLocation(confirmedLocation);
      setHasUserSetLocation(true);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "tiding_customer_location",
            JSON.stringify({
              latitude: activeCoords.latitude,
              longitude: activeCoords.longitude,
              accuracy: activeAccuracy,
              locationSource: activeSource,
              isConfirmed: true,
              address: {
                fullAddress: confirmedLocation.formattedAddress,
                street: confirmedLocation.street,
                locality: confirmedLocation.area,
                city: confirmedLocation.city,
                state: confirmedLocation.state,
                country: confirmedLocation.country,
                postalCode: confirmedLocation.pincode,
                houseNo: confirmedLocation.houseNo,
                landmark: confirmedLocation.landmark,
              },
            })
          );
        } catch { }
      }
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["store-inventory"] });

      toast.success(
        `Delivery location confirmed! Delivering to ${confirmedLocation.area || confirmedLocation.city}.`
      );
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to confirm delivery location. Please try again.");
    } finally {
      setIsConfirmingLocation(false);
    }
  }, [
    activeCoords,
    activeAccuracy,
    activeSource,
    addressDetails,
    currentLocation,
    setCurrentLocation,
    setHasUserSetLocation,
    queryClient,
    setIsOpen,
    router,
  ]);

  // Select an existing saved address from profile
  const handleSelectSavedAddress = async (addr: CustomerAddress) => {
    const lat = Number(addr.latitude) || activeCoords.latitude;
    const lng = Number(addr.longitude) || activeCoords.longitude;

    const parts = [
      addr.address_line_1,
      addr.address_line_2,
      addr.landmark,
      addr.area_name,
      addr.city_name,
      addr.pincode,
    ].filter(Boolean);
    const formatted = parts.join(", ");

    const updatedLocation: DeliveryLocation = {
      id: addr.id,
      areaId: addr.area_id,
      area: addr.area_name || addr.address_line_2 || "Home",
      houseNo: addr.address_line_1,
      society: addr.address_line_2 || addr.area_name || "",
      landmark: addr.landmark || "",
      city: addr.city_name || "",
      state: addr.state_name || "",
      pincode: addr.pincode || "",
      formattedAddress: formatted,
      coordinates: { latitude: lat, longitude: lng },
      accuracy: 10,
      locationSource: "saved_address",
      deliveryEtaMinutes: 8,
      isServiceable: true,
      addressType: addr.address_type,
      savedAddressId: addr.id,
    };

    // Save to backend location log
    await locationService.saveLocation({
      latitude: lat,
      longitude: lng,
      accuracy: 10,
      locationSource: "saved_address",
      isUserConfirmed: true,
    });

    setCurrentLocation(updatedLocation);
    setHasUserSetLocation(true);
    setIsOpen(false);
    queryClient.invalidateQueries({ queryKey: ["catalog"] });
    toast.success(`Delivering to saved address (${updatedLocation.area})`);
    router.refresh();
  };

  // const accuracyData = getAccuracyInfo(activeAccuracy);

  // Real delivery data (store lookup wins over geocode defaults)
  const etaMinutes = storeInfo?.deliveryEtaMinutes ?? addressDetails.deliveryEtaMinutes;
  const isServiceable = storeInfo?.isServiceable ?? addressDetails.isServiceable;
  const storeName = storeInfo?.storeName ?? addressDetails.darkStoreName;
  const storeDistanceKm = storeInfo?.distanceKm;

  const detailRows: { label: string; value?: string }[] = [
    { label: "Street", value: [addressDetails.street, addressDetails.road].filter(Boolean).join(", ") },
    { label: "Locality", value: addressDetails.locality || addressDetails.area },
    { label: "City", value: addressDetails.city },
    { label: "State", value: addressDetails.state },
    { label: "PIN code", value: addressDetails.postalCode },
  ].filter((row) => !!row.value);

  const tabClass = (active: boolean) =>
    `flex-1 h-8 rounded-lg text-xs font-bold transition-all ${active
      ? "bg-[#0c831f] text-white shadow-sm shadow-emerald-700/30"
      : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
    }`;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-md p-0 gap-0 overflow-hidden border-[var(--border)] bg-[var(--surface)] shadow-2xl shadow-emerald-900/10 rounded-3xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 shrink-0 bg-gradient-to-b from-emerald-50 to-transparent dark:from-emerald-950/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#16a02c] to-[#0c831f] text-white shadow-md shadow-emerald-700/30">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-extrabold tracking-tight text-[var(--text-primary)]">
                  Choose delivery location
                </DialogTitle>
                <DialogDescription className="text-xs text-[var(--text-secondary)]">
                  Where should we deliver?
                </DialogDescription>
              </div>
            </div>

            {savedAddresses.length > 0 && (
              <div className="mt-3 flex gap-1 rounded-xl bg-white/80 dark:bg-neutral-800 p-1 ring-1 ring-black/5">
                <button
                  type="button"
                  onClick={() => setViewMode("map")}
                  className={tabClass(viewMode === "map")}
                >
                  Map
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("saved")}
                  className={tabClass(viewMode === "saved")}
                >
                  Saved ({savedAddresses.length})
                </button>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {viewMode === "map" ? (
              <div className="px-4 pb-4 space-y-3">
                {/* Map with floating locate button */}
                <div className="relative w-full h-[230px] sm:h-[270px] rounded-3xl overflow-hidden border-4 border-white dark:border-neutral-800 ring-1 ring-black/10 shadow-lg shadow-emerald-900/10">
                  <GoogleMapPicker
                    coordinates={activeCoords}
                    accuracyMeters={activeAccuracy}
                    locationSource={activeSource}
                    onCoordinatesChange={handleCoordinatesChange}
                    onDetectLocation={handleDetectGPS}
                    isDetectingGPS={isDetecting}
                    className="w-full h-full"
                    enableSearch={true}
                  />

                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={isDetecting}
                    className="absolute bottom-2.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white/95 backdrop-blur text-[#0c831f] text-xs font-bold shadow-lg shadow-black/10 ring-1 ring-black/5 active:scale-95 transition disabled:opacity-70"
                  >
                    {isDetecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="h-3.5 w-3.5" />
                    )}
                    {isDetecting ? "Locating..." : "Use current location"}
                  </button>
                </div>

                {/* Approximate-location notice */}
                {activeSource === "ip_location" && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                      We found you near <strong>{addressDetails.city || "your city"}</strong>. Drag the
                      pin to your exact building.
                    </p>
                  </div>
                )}



                {/* Selected address */}
                <div className="rounded-3xl border border-emerald-100 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50 via-white to-white dark:from-emerald-950/30 dark:to-neutral-900 p-4 shadow-md shadow-emerald-900/5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-emerald-950/60 text-[#0c831f] shadow-sm ring-1 ring-emerald-100 dark:ring-emerald-900/50">
                      {isReverseGeocoding ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <MapPin className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                        {isReverseGeocoding
                          ? "Finding address..."
                          : addressDetails.area || addressDetails.locality || "Pinned location"}
                      </h4>
                      <p className="mt-0.5 text-xs leading-snug text-neutral-600 dark:text-neutral-400">
                        {addressDetails.fullAddress || "Select a spot on the map to see your address."}
                      </p>
                    </div>
                  </div>

                  {/* Address breakdown */}
                  {detailRows.length > 0 && (
                    <dl className="mt-3 grid grid-cols-2 gap-2">
                      {detailRows.map((row) => (
                        <div key={row.label} className="min-w-0 rounded-2xl bg-white dark:bg-neutral-800/70 px-3 py-2 ring-1 ring-black/5 shadow-sm">
                          <dt className="text-[10px] font-semibold text-neutral-400">{row.label}</dt>
                          <dd className="truncate text-sm font-bold text-neutral-800 dark:text-neutral-200">
                            {row.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {/* Delivery info */}
                  {isServiceable === false ? (
                    <div className="mt-3 flex items-center gap-2 rounded-2xl bg-red-50 dark:bg-red-950/40 px-3 py-2 text-xs font-semibold text-red-600">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      We don&apos;t deliver to this spot yet. Try moving the pin.
                    </div>
                  ) : (
                    (etaMinutes || storeName) && (
                      <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-gradient-to-r from-[#0c831f] to-[#16a02c] px-4 py-3 text-white shadow-lg shadow-emerald-700/25">
                        <div className="flex items-center gap-1.5 text-sm font-extrabold">
                          <Zap className="h-4 w-4 fill-current" />
                          {etaMinutes ? `Delivery in ${etaMinutes} mins` : "Express delivery"}
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0 text-[11px] font-medium text-emerald-50">
                          <Store className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {storeName || "Nearest store"}
                            {typeof storeDistanceKm === "number" && ` · ${storeDistanceKm.toFixed(1)} km`}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : (
              /* Saved addresses */
              <div className="px-4 pb-4 space-y-3">
                {savedAddresses.map((addr) => {
                  const isSelected =
                    currentLocation.id === addr.id ||
                    (currentLocation.coordinates?.latitude === Number(addr.latitude) &&
                      currentLocation.coordinates?.longitude === Number(addr.longitude));
                  const isWork = addr.address_type === "WORK";

                  return (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handleSelectSavedAddress(addr)}
                      className={`w-full flex items-start gap-3 rounded-3xl border p-4 text-left shadow-sm transition-all ${isSelected
                        ? "border-[#0c831f] bg-emerald-50/70 dark:bg-emerald-950/30 shadow-sm shadow-emerald-700/10"
                        : "border-[var(--border)] hover:bg-neutral-50 dark:hover:bg-neutral-900"
                        }`}
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isSelected
                          ? "bg-[#0c831f] text-white"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                          }`}
                      >
                        {isWork ? <Briefcase className="h-4 w-4" /> : <Home className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                            {isWork ? "Work" : "Home"}
                          </span>
                          {addr.is_default && (
                            <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">
                          {[addr.address_line_1, addr.address_line_2, addr.landmark, addr.city_name, addr.pincode]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        {(addr.recipient_name || addr.recipient_phone) && (
                          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {[addr.recipient_name, addr.recipient_phone].filter(Boolean).join(" · ")}
                            </span>
                          </p>
                        )}
                      </div>
                      {isSelected && <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#0c831f]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sticky footer (map view only) */}
          {viewMode === "map" && (
            <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 space-y-1">
              <Button
                type="button"
                onClick={handleConfirmLocation}
                disabled={isConfirmingLocation || isReverseGeocoding}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#0c831f] to-[#16a02c] hover:brightness-95 text-white font-bold text-sm shadow-lg shadow-emerald-700/25 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isConfirmingLocation ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving location...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 stroke-[3]" />
                    Confirm location
                  </>
                )}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsAddressModalOpen(true);
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold text-[#0c831f] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add house or flat details
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Doorstep Address Modal for saving flat/house number if user wishes */}
      {isAddressModalOpen && (
        <AddressModal
          isOpen={isAddressModalOpen}
          onClose={() => setIsAddressModalOpen(false)}
          onSave={async (data) => {
            setIsAddressModalOpen(false);
            setIsOpen(false);
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.ADDRESSES() });
            toast.success("Doorstep details saved successfully!");
          }}
          detectedLocation={{
            ...currentLocation,
            coordinates: activeCoords,
            accuracy: activeAccuracy,
            locationSource: activeSource,
            formattedAddress: addressDetails.fullAddress || currentLocation.formattedAddress,
            city: addressDetails.city || currentLocation.city,
            state: addressDetails.state || currentLocation.state,
            pincode: addressDetails.postalCode || currentLocation.pincode,
          }}
        />
      )}
    </>
  );
}