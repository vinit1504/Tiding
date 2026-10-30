"use client";

import React, { useState, useCallback } from "react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Navigation,
  Home,
  Briefcase,
  Loader2,
  Check,
  Plus,
  Bookmark,
  Radio,
  Zap,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
import { DeliveryLocation, SavedAddress } from "@/types/location";
import { CustomerAddress } from "@/types/address";
import { useCustomerAddressesQuery, useCreateAddressMutation } from "@/queries";
import { QUERY_KEYS } from "@/queries/query-keys";
import { resolveDeliveryStoreApi, ResolvedStoreData } from "@/queries/location/use-geocode-query";
import { useQueryClient } from "@tanstack/react-query";
import { isUuid } from "@/lib/api/catalog-service";
import { locationService } from "@/lib/api/location-service";
import { toast } from "sonner";
import { AddressModal } from "../account";

type DetectionStep = "idle" | "gps" | "reverse" | "store" | "complete" | "error";

interface DetectionStatus {
  step: DetectionStep;
  coords?: { latitude: number; longitude: number };
  addressTitle?: string;
  formattedAddress?: string;
  storeName?: string;
  etaMinutes?: number;
  errorMessage?: string;
}

export function LocationModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useAtom(isLocationModalOpenAtom);
  const [currentLocation, setCurrentLocation] = useAtom(persistentLocationAtom);
  const [, setHasUserSetLocation] = useAtom(hasUserSetLocationAtom);

  const [user, setUser] = useAtom(userProfileAtom);
  const [session] = useAtom(authSessionAtom);
  const [, setIsAuthDrawerOpen] = useAtom(isAuthDrawerOpenAtom);

  const [isLocating, setIsLocating] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState<DetectionStatus>({ step: "idle" });
  const [detectedLocationData, setDetectedLocationData] = useState<DeliveryLocation | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const createAddressMutation = useCreateAddressMutation();

  // Fetch real saved customer addresses from profile
  const { data: serverSavedAddresses = [], isLoading: isLoadingAddresses } = useCustomerAddressesQuery();
  const isAuthenticated = !!user || session.isAuthenticated;

  // Merge server addresses with local user profile addresses to ensure full offline & online coverage
  const savedAddresses: CustomerAddress[] = React.useMemo(() => {
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

  // Handle GPS location detection & store resolution with proper multi-step progress flow
  const handleDetectLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setDetectionStatus({ step: "gps" });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let detected: DeliveryLocation | null = null;
        let resolvedStore: ResolvedStoreData | null = null;

        // Step 1 Complete: Coordinates locked
        setDetectionStatus({
          step: "reverse",
          coords: { latitude, longitude },
        });

        try {
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

        // Direct Nominatim fallback if reverse geocode had an issue
        if (!detected) {
          try {
            const nomRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
              { headers: { Accept: "application/json" } }
            );
            if (nomRes.ok) {
              const data = await nomRes.json();
              const addr = data.address || {};
              const soc =
                addr.residential ||
                addr.neighbourhood ||
                addr.suburb ||
                addr.road ||
                addr.city_district ||
                "Current Location";

              detected = {
                area: soc,
                society: soc,
                city: addr.city || addr.town || "Surat",
                state: addr.state || "Gujarat",
                pincode: addr.postcode || "395007",
                formattedAddress: data.display_name,
                coordinates: { latitude, longitude },
                deliveryEtaMinutes: 8,
                isServiceable: true,
              };
            }
          } catch (nomErr) {
            console.warn("Direct reverse geocode error:", nomErr);
          }
        }

        // Ensure city is resolved (from formattedAddress or coordinates if empty)
        let resolvedCity = detected?.city || "";
        if (!resolvedCity && detected?.formattedAddress) {
          if (/ahmedabad/i.test(detected.formattedAddress)) {
            resolvedCity = "Ahmedabad";
          } else if (/surat/i.test(detected.formattedAddress)) {
            resolvedCity = "Surat";
          }
        }
        if (!resolvedCity) {
          resolvedCity = latitude > 22.2 ? "Ahmedabad" : "Surat";
        }

        // Ensure 6-digit pincode is resolved if present in formattedAddress
        let resolvedPincode = detected?.pincode || "";
        if (!resolvedPincode && detected?.formattedAddress) {
          const pinMatch = detected.formattedAddress.match(/\b([1-9][0-9]{5})\b/);
          if (pinMatch) resolvedPincode = pinMatch[1];
        }
        if (!resolvedPincode) {
          resolvedPincode = resolvedCity === "Ahmedabad" ? "380058" : "395007";
        }

        if (detected) {
          detected.city = resolvedCity;
          detected.pincode = resolvedPincode;
        }

        const areaName = detected?.society || detected?.area || "South Bopal";
        const cityName = resolvedCity;

        // Step 2 Complete: Reverse geocode resolved, now resolving store
        setDetectionStatus({
          step: "store",
          coords: { latitude, longitude },
          addressTitle: `${areaName}, ${cityName}`,
          formattedAddress: detected?.formattedAddress,
        });

        const storeName = resolvedStore?.storeName || detected?.darkStoreName || "Tiding Butcher's Choice & Coastal Fresh - Bopal";
        const etaMinutes = resolvedStore?.deliveryEtaMinutes || detected?.deliveryEtaMinutes || 12;

        const finalLocation: DeliveryLocation = detected
          ? {
              ...detected,
              city: resolvedCity,
              pincode: resolvedPincode,
              coordinates: { latitude, longitude },
              darkStoreId: resolvedStore?.storeId || detected.darkStoreId,
              darkStoreName: storeName,
              storeAddress: resolvedStore?.storeAddress || detected.storeAddress,
              deliveryEtaMinutes: etaMinutes,
              isServiceable: resolvedStore ? resolvedStore.isServiceable : true,
              storeDistanceKm: resolvedStore?.distanceKm,
            }
          : {
              area: areaName,
              society: areaName,
              city: resolvedCity,
              state: "Gujarat",
              pincode: resolvedPincode,
              formattedAddress: `Current Location, ${areaName}, ${resolvedCity}, Gujarat`,
              coordinates: { latitude, longitude },
              deliveryEtaMinutes: 12,
              isServiceable: true,
              darkStoreName: storeName,
            };

        // Step 3 Complete: Dark store resolved and location ready
        setDetectionStatus({
          step: "complete",
          coords: { latitude, longitude },
          addressTitle: `${finalLocation.society || finalLocation.area}, ${finalLocation.city}`,
          storeName: finalLocation.darkStoreName,
          etaMinutes: finalLocation.deliveryEtaMinutes,
        });

        // 1. Store the detected location in the global persistent store
        setCurrentLocation(finalLocation);
        setHasUserSetLocation(true);
        setDetectedLocationData(finalLocation);
        queryClient.invalidateQueries({ queryKey: ["catalog"] });

        // 2. Delightful brief pause to let the user see the complete verified flow, then automatically open Address Popup!
        setTimeout(() => {
          setIsLocating(false);
          setDetectionStatus({ step: "idle" });
          setIsOpen(false);
          setIsAddressModalOpen(true);
          toast.success("Location verified! Please enter your doorstep details to save.");
        }, 750);
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = "Unable to retrieve GPS location. Please try again or select a saved address.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location permission denied. Please allow location access in your browser.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Location request timed out. Please try again.";
        }
        setDetectionStatus({
          step: "error",
          errorMessage: errorMsg,
        });
        toast.error(errorMsg);
      },
      { timeout: 12000, enableHighAccuracy: true, maximumAge: 0 }
    );
  }, [setCurrentLocation, setHasUserSetLocation, setIsOpen, queryClient]);

  // Select an existing saved address from customer account
  const handleSelectSavedAddress = async (addr: CustomerAddress) => {
    const parts = [
      addr.address_line_1,
      addr.address_line_2,
      addr.landmark,
      addr.area_name,
      addr.city_name,
      addr.pincode,
    ].filter(Boolean);
    const formattedAddress = parts.join(", ");

    const areaName = addr.area_name || addr.address_line_2 || addr.address_line_1;
    const societyName = addr.address_line_2 || addr.area_name || addr.address_line_1;

    let updatedLocation: DeliveryLocation = {
      id: addr.id,
      areaId: addr.area_id,
      area: areaName,
      houseNo: addr.address_line_1,
      society: societyName,
      landmark: addr.landmark || "",
      city: addr.city_name || "Surat",
      state: addr.state_name || "Gujarat",
      pincode: addr.pincode || "395007",
      formattedAddress,
      coordinates: {
        latitude: Number(addr.latitude) || 21.1702,
        longitude: Number(addr.longitude) || 72.8311,
      },
      deliveryEtaMinutes: 8,
      isServiceable: true,
    };
    (updatedLocation as any).addressType = addr.address_type;
    (updatedLocation as any).savedAddressId = addr.id;

    if (addr.area_id) {
      try {
        const resolvedStore = await resolveDeliveryStoreApi({ area_id: addr.area_id });
        if (resolvedStore) {
          updatedLocation = {
            ...updatedLocation,
            areaId: addr.area_id,
            darkStoreId: resolvedStore.storeId || updatedLocation.darkStoreId,
            darkStoreName: resolvedStore.storeName || updatedLocation.darkStoreName,
            storeAddress: resolvedStore.storeAddress || updatedLocation.storeAddress,
            deliveryEtaMinutes: resolvedStore.deliveryEtaMinutes || 8,
            isServiceable: resolvedStore.isServiceable,
            storeDistanceKm: resolvedStore.distanceKm,
          };
        }
      } catch (err) {
        console.warn("Resolve store by area error:", err);
      }
    } else if (addr.latitude && addr.longitude) {
      try {
        const resolvedStore = await resolveDeliveryStoreApi({
          latitude: Number(addr.latitude),
          longitude: Number(addr.longitude),
        });
        if (resolvedStore) {
          updatedLocation = {
            ...updatedLocation,
            darkStoreId: resolvedStore.storeId || updatedLocation.darkStoreId,
            darkStoreName: resolvedStore.storeName || updatedLocation.darkStoreName,
            storeAddress: resolvedStore.storeAddress || updatedLocation.storeAddress,
            deliveryEtaMinutes: resolvedStore.deliveryEtaMinutes || 8,
            isServiceable: resolvedStore.isServiceable,
            storeDistanceKm: resolvedStore.distanceKm,
          };
        }
      } catch (err) {
        console.warn("Resolve store by coords error:", err);
      }
    }

    setCurrentLocation(updatedLocation);
    setHasUserSetLocation(true);
    setIsOpen(false);
    queryClient.invalidateQueries({ queryKey: ["catalog"] });
    router.refresh();
    toast.success(
      `Delivering to ${addr.address_type === "HOME" ? "Home" : addr.address_type === "WORK" ? "Work" : "Saved Address"} (${updatedLocation.area})!`
    );
  };

  const handleAddNewAddress = () => {
    setIsOpen(false);
    setDetectedLocationData(currentLocation);
    setIsAddressModalOpen(true);
  };

  // Save the address in current user address and update global location
  const handleSaveNewAddress = async (
    data: Partial<SavedAddress> & { floor?: string; houseNo?: string }
  ) => {
    try {
      const houseNumber = data.houseNo || data.addressLine?.split(",")[0]?.trim() || "House";
      const fullAddressLine = [
        houseNumber,
        data.floor?.trim() ? `${data.floor.trim()} Floor` : "",
        data.landmark?.trim(),
      ]
        .filter(Boolean)
        .join(", ");

      const selectedCoords = detectedLocationData?.coordinates || currentLocation.coordinates || {
        latitude: 21.1702,
        longitude: 72.8311,
      };

      let createdServerAddress: CustomerAddress | null = null;

      // 1. If authenticated, persist to backend DB
      if (isAuthenticated) {
        try {
          const resolved = await locationService.resolveHierarchyUuids({
            areaId: data.areaId || detectedLocationData?.areaId || currentLocation.areaId,
            cityId: data.cityId || (currentLocation as any)?.cityId,
            stateId: data.stateId || (currentLocation as any)?.stateId,
            countryId: data.countryId || (currentLocation as any)?.countryId,
            pincodeId: data.pincodeId,
            areaName: data.area || detectedLocationData?.area || currentLocation.area,
            cityName: data.city || detectedLocationData?.city || currentLocation.city,
            stateName: detectedLocationData?.state || currentLocation.state,
          });

          if (
            isUuid(resolved.areaId) &&
            isUuid(resolved.cityId) &&
            isUuid(resolved.stateId) &&
            isUuid(resolved.countryId)
          ) {
            createdServerAddress = await createAddressMutation.mutateAsync({
              address_type: (data.type?.toUpperCase() === "WORK"
                ? "WORK"
                : data.type?.toUpperCase() === "OTHER"
                ? "OTHER"
                : "HOME") as any,
              recipient_name: data.receiverName || user?.name || "Customer",
              recipient_phone: data.receiverPhone || user?.phone || "9876543210",
              address_line_1: houseNumber,
              address_line_2: data.area || detectedLocationData?.area || null,
              landmark: data.landmark || null,
              area_id: resolved.areaId!,
              city_id: resolved.cityId!,
              state_id: resolved.stateId!,
              country_id: resolved.countryId!,
              pincode_id: isUuid(resolved.pincodeId) ? resolved.pincodeId : null,
              latitude: String(selectedCoords.latitude),
              longitude: String(selectedCoords.longitude),
              is_default: savedAddresses.length === 0,
            });
          } else {
            console.warn("Could not resolve valid UUIDs for backend address creation; saving locally:", resolved);
          }
        } catch (apiErr: any) {
          console.warn("Backend address creation error (fallback to local state):", apiErr);
          const errorMsg = apiErr?.message || "Could not sync address to server. Saved locally.";
          toast.error(errorMsg);
        }
      }

      // 2. Build SavedAddress record
      const newAddressId = createdServerAddress?.id || `addr-${Date.now()}`;
      const savedItem: SavedAddress = {
        id: newAddressId,
        type: (data.type?.toLowerCase() === "work" ? "work" : "home") as any,
        title: data.title || (data.type?.toUpperCase() === "WORK" ? "Work" : "Home"),
        addressLine: fullAddressLine || data.addressLine || houseNumber,
        landmark: data.landmark || "",
        area: data.area || detectedLocationData?.area || "",
        city: data.city || detectedLocationData?.city || "",
        pincode: data.pincode || detectedLocationData?.pincode || "",
        areaId: data.areaId || detectedLocationData?.areaId,
        cityId: data.cityId,
        stateId: data.stateId,
        countryId: data.countryId,
        pincodeId: data.pincodeId,
        coordinates: selectedCoords,
        isDefault: savedAddresses.length === 0,
        receiverName: data.receiverName || user?.name || "Customer",
        receiverPhone: data.receiverPhone || user?.phone || "9876543210",
      };

      // 3. Update user profile state & localStorage
      if (user) {
        const existing = user.savedAddresses || [];
        const updatedUser = {
          ...user,
          savedAddresses: [savedItem, ...existing.filter((a) => a.id !== newAddressId)],
        };
        setUser(updatedUser);
        try {
          localStorage.setItem("tiding_user", JSON.stringify(updatedUser));
        } catch {}
      }

      // 4. Update the active DeliveryLocation so the app immediately delivers to this address
      const finalLoc: DeliveryLocation = {
        id: newAddressId,
        areaId: detectedLocationData?.areaId || currentLocation.areaId,
        houseNo: houseNumber,
        society: data.area || detectedLocationData?.society || detectedLocationData?.area || "",
        area: data.area || detectedLocationData?.area || "",
        landmark: data.landmark || "",
        city: data.city || detectedLocationData?.city || "Surat",
        state: detectedLocationData?.state || "Gujarat",
        pincode: data.pincode || detectedLocationData?.pincode || "395007",
        formattedAddress: [fullAddressLine, data.area, data.city, data.pincode].filter(Boolean).join(", "),
        coordinates: selectedCoords,
        darkStoreId: detectedLocationData?.darkStoreId || currentLocation.darkStoreId,
        darkStoreName: detectedLocationData?.darkStoreName || currentLocation.darkStoreName || "Tiding Express Store",
        storeAddress: detectedLocationData?.storeAddress || currentLocation.storeAddress,
        deliveryEtaMinutes: detectedLocationData?.deliveryEtaMinutes || currentLocation.deliveryEtaMinutes || 8,
        isServiceable: true,
      };
      (finalLoc as any).addressType = data.type?.toUpperCase() || "HOME";
      (finalLoc as any).savedAddressId = newAddressId;

      setCurrentLocation(finalLoc);
      setHasUserSetLocation(true);
      setIsAddressModalOpen(false);
      setIsOpen(false);
      setDetectedLocationData(null);

      // Invalidate queries so that Header, Saved Addresses, Account, etc. reflect the changes immediately
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.ADDRESSES() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.PROFILE() });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      router.refresh();

      toast.success(
        `Address saved! Delivering to ${finalLoc.houseNo || finalLoc.area} in ${finalLoc.deliveryEtaMinutes} mins`
      );
    } catch (err: any) {
      console.warn("Save address notice:", err?.message || err);
      toast.error("Failed to save delivery address.");
    }
  };

  const handleLoginClick = () => {
    setIsOpen(false);
    setIsAuthDrawerOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-[var(--border)] bg-[var(--surface)] shadow-2xl rounded-2xl sm:rounded-3xl">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[var(--border)] space-y-1 bg-[var(--surface)]">
            <DialogHeader className="space-y-1">
              <div className="flex items-center gap-2 text-[#0c831f]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#0c831f]">
                  <MapPin className="h-4 w-4" />
                </div>
                <DialogTitle className="text-base font-bold text-[var(--text-primary)]">
                  Delivery Location
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-[var(--text-secondary)]">
                Detect your live location or pick from saved addresses
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 space-y-4 max-h-[65vh] overflow-y-auto">
            {/* Live GPS Detection Flow Progression View */}
            {isLocating ? (
              <div className="py-2 px-1 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                {/* Animated Radar Pulse Card */}
                <div className="relative flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/25 overflow-hidden text-center">
                  <div className="relative flex items-center justify-center mb-3">
                    <div className="absolute h-20 w-20 rounded-full bg-emerald-500/15 animate-ping" />
                    <div className="absolute h-14 w-14 rounded-full bg-emerald-500/25 animate-pulse" />
                    <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#0c831f] text-white shadow-lg shadow-emerald-600/30">
                      <Navigation className="h-5 w-5 animate-pulse" />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {detectionStatus.step === "gps" && "Requesting GPS Satellite Lock..."}
                    {detectionStatus.step === "reverse" && "Identifying Society & Street Name..."}
                    {detectionStatus.step === "store" && "Connecting to Nearest Express Hub..."}
                    {detectionStatus.step === "complete" && "Location Verified Successfully!"}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {detectionStatus.step === "gps" && "Accessing high-accuracy device coordinates"}
                    {detectionStatus.step === "reverse" && "Resolving postal locality and doorstep landmark"}
                    {detectionStatus.step === "store" && "Checking instant dark store inventory & speed ETA"}
                    {detectionStatus.step === "complete" && "Opening doorstep delivery address form..."}
                  </p>

                  {/* Live Coordinates Badge */}
                  {detectionStatus.coords && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-neutral-800 text-[11px] font-mono font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-xs">
                      <Radio className="h-3 w-3 animate-pulse text-[#0c831f]" />
                      <span>
                        {detectionStatus.coords.latitude.toFixed(4)}° N, {detectionStatus.coords.longitude.toFixed(4)}° E
                      </span>
                    </div>
                  )}
                </div>

                {/* Step Progression Checklist */}
                <div className="space-y-2.5 p-3.5 rounded-xl bg-gray-50/90 dark:bg-neutral-850/60 border border-[var(--border)]">
                  {/* Step 1: GPS Lock */}
                  <div className="flex items-center gap-2.5 text-xs">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 transition-all ${
                        detectionStatus.coords
                          ? "bg-[#0c831f] text-white"
                          : "bg-emerald-100 dark:bg-emerald-950/60 text-[#0c831f]"
                      }`}
                    >
                      {detectionStatus.coords ? (
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      ) : (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--text-primary)]">GPS Device Coordinates</p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">
                        {detectionStatus.coords
                          ? "Satellite signal locked"
                          : "Requesting browser permission..."}
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Locality Reverse Geocode */}
                  <div className="flex items-center gap-2.5 text-xs">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 transition-all ${
                        detectionStatus.addressTitle
                          ? "bg-[#0c831f] text-white"
                          : detectionStatus.step === "reverse"
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-[#0c831f]"
                          : "bg-gray-200 dark:bg-neutral-800 text-gray-400"
                      }`}
                    >
                      {detectionStatus.addressTitle ? (
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      ) : detectionStatus.step === "reverse" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <span className="text-[10px] font-bold">2</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--text-primary)]">Doorstep Locality</p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">
                        {detectionStatus.addressTitle || "Resolving street & society details..."}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Express Dark Store */}
                  <div className="flex items-center gap-2.5 text-xs">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 transition-all ${
                        detectionStatus.step === "complete"
                          ? "bg-[#0c831f] text-white"
                          : detectionStatus.step === "store"
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-[#0c831f]"
                          : "bg-gray-200 dark:bg-neutral-800 text-gray-400"
                      }`}
                    >
                      {detectionStatus.step === "complete" ? (
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      ) : detectionStatus.step === "store" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <span className="text-[10px] font-bold">3</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--text-primary)]">Nearest Dark Store & ETA</p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">
                        {detectionStatus.storeName
                          ? `${detectionStatus.storeName} (${detectionStatus.etaMinutes || 8} mins)`
                          : "Checking nearest express fulfillment hub..."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cancel Detection Button */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLocating(false);
                      setDetectionStatus({ step: "idle" });
                    }}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] underline cursor-pointer"
                  >
                    Cancel detection
                  </button>
                </div>
              </div>
            ) : detectionStatus.step === "error" ? (
              /* Error State View with Retry / Manual Input */
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-3 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 mx-auto">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    Location Detection Failed
                  </h4>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300">
                    {detectionStatus.errorMessage || "Could not retrieve GPS location."}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1 justify-center">
                  <Button
                    size="sm"
                    onClick={handleDetectLocation}
                    className="h-8 bg-[#0c831f] hover:bg-[#0a6f1a] text-white text-xs font-semibold rounded-lg"
                  >
                    Try Again
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddNewAddress}
                    className="h-8 text-xs font-semibold rounded-lg"
                  >
                    Enter Address Manually
                  </Button>
                </div>
              </div>
            ) : (
              /* Normal Idle View */
              <>
                {/* GPS Auto-Detect Button */}
                <div className="space-y-1.5">
                  <Button
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="w-full h-11 bg-[#0c831f] hover:bg-[#0a6f1a] text-white flex items-center justify-center gap-2 font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.99] cursor-pointer rounded-xl"
                  >
                    <Navigation className="h-4 w-4 fill-white/20" />
                    <span>Detect Current Location</span>
                  </Button>
                  <p className="text-[11px] text-[var(--text-muted)] text-center">
                    Using device GPS for precise doorstep delivery
                  </p>
                </div>

                {/* Saved Addresses Section */}
                <div className="pt-3 border-t border-[var(--border)] space-y-2.5">
                  <div className="flex items-center justify-between px-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                      <Bookmark className="h-3.5 w-3.5 text-[#0c831f]" />
                      <span>Saved Addresses</span>
                      {savedAddresses.length > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-[#0c831f] dark:bg-emerald-950/50">
                          {savedAddresses.length}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddNewAddress}
                      className="text-[11px] font-bold text-[#0c831f] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add New</span>
                    </button>
                  </div>

                  {isLoadingAddresses ? (
                    <div className="p-6 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#0c831f]" />
                      <span>Loading saved addresses...</span>
                    </div>
                  ) : savedAddresses.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                      {savedAddresses.map((addr) => {
                        const isHome = addr.address_type === "HOME";
                        const isWork = addr.address_type === "WORK";
                        const isSelected =
                          currentLocation.id === addr.id ||
                          (currentLocation as any).savedAddressId === addr.id ||
                          (currentLocation.houseNo &&
                            addr.address_line_1?.toLowerCase().trim() ===
                              currentLocation.houseNo?.toLowerCase().trim());

                        return (
                          <div
                            key={addr.id}
                            onClick={() => handleSelectSavedAddress(addr)}
                            className={`group flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? "border-[#0c831f] bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs ring-1 ring-[#0c831f]/20"
                                : "border-[var(--border)] bg-[var(--surface)] hover:border-[#0c831f]/40 hover:bg-gray-50/70 dark:hover:bg-neutral-800/50"
                            }`}
                          >
                            {/* Type Icon */}
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 mt-0.5 ${
                                isHome
                                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40"
                                  : isWork
                                  ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40"
                                  : "bg-emerald-50 text-[#0c831f] dark:bg-emerald-950/40"
                              }`}
                            >
                              {isHome ? (
                                <Home className="h-4 w-4" />
                              ) : isWork ? (
                                <Briefcase className="h-4 w-4" />
                              ) : (
                                <MapPin className="h-4 w-4" />
                              )}
                            </div>

                            {/* Address Details */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-[var(--text-primary)]">
                                  {addr.address_type || "HOME"}
                                </span>
                                {addr.is_default && (
                                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300">
                                    Default
                                  </span>
                                )}
                                {isSelected && (
                                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-[#0c831f] dark:bg-emerald-950/50 ml-auto flex items-center gap-0.5">
                                    <Check className="h-2.5 w-2.5" />
                                    Selected
                                  </span>
                                )}
                              </div>

                              <p className="text-xs font-semibold text-[var(--text-secondary)] mt-0.5 truncate">
                                {addr.recipient_name}
                                {addr.recipient_phone ? ` • ${addr.recipient_phone}` : ""}
                              </p>
                              <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-0.5 leading-snug">
                                {[
                                  addr.address_line_1,
                                  addr.address_line_2,
                                  addr.landmark,
                                  addr.area_name,
                                  addr.city_name,
                                  addr.pincode,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Empty state when no saved addresses */
                    <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-center space-y-2 bg-[var(--surface-secondary)]/30">
                      <p className="text-xs font-medium text-[var(--text-secondary)]">
                        {isAuthenticated
                          ? "You haven't saved any doorstep addresses yet."
                          : "Sign in to view and save delivery addresses for 1-tap checkout."}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={isAuthenticated ? handleAddNewAddress : handleLoginClick}
                        className="text-xs font-bold text-[#0c831f] border-[#0c831f]/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        <span>
                          {isAuthenticated ? "Add Delivery Address" : "Sign In to View Addresses"}
                        </span>
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Save Doorstep Delivery Address Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => {
          setIsAddressModalOpen(false);
          setDetectedLocationData(null);
        }}
        detectedLocation={detectedLocationData}
        onSave={handleSaveNewAddress}
        isSaving={createAddressMutation.isPending}
      />
    </>
  );
}
