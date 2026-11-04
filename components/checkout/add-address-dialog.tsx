"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Home,
  Briefcase,
  MapPin,
  Loader2,
  Search,
  X,
  Navigation,
  Zap,
  Building,
} from "lucide-react";
import {
  useCreateAddressMutation,
  useUpdateAddressMutation,
} from "@/queries/customer/use-address-queries";
import { locationService } from "@/lib/api/location-service";
import { isUuid } from "@/lib/api/catalog-service";
import { toast } from "sonner";
import { useAtomValue } from "jotai";
import { deliveryLocationAtom } from "@/stores";
import { useAuth } from "@/hooks/use-auth";
import type { MapLocationResult } from "@/components/location/interactive-map";
import { AddressCardData } from "./delivery-address-section";

// Dynamically import InteractiveMap (Leaflet client-side only)
const InteractiveMap = dynamic(
  () => import("@/components/location/interactive-map"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[320px] flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-2xl">
        <Loader2 className="h-8 w-8 text-[#0c831f] animate-spin mb-2" />
        <span className="text-xs font-semibold">Loading Live Map...</span>
      </div>
    ),
  }
);

interface AddAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addressToEdit?: AddressCardData | null;
  initialCoordinates?: { latitude: number; longitude: number } | null;
  onAddressCreated?: (address: any) => void;
  onAddressSaved?: (address: AddressCardData) => void;
}

export function AddAddressDialog({
  open,
  onOpenChange,
  addressToEdit,
  initialCoordinates,
  onAddressCreated,
  onAddressSaved,
}: AddAddressDialogProps) {
  const location = useAtomValue(deliveryLocationAtom);
  const { user } = useAuth();
  const createAddressMutation = useCreateAddressMutation();
  const updateAddressMutation = useUpdateAddressMutation();

  const isEditMode = !!addressToEdit;

  // Pin coordinates (defaults to address being edited, initialCoordinates, deliveryLocationAtom, or Ahmedabad)
  const defaultCoords = {
    latitude:
      addressToEdit?.latitude ||
      initialCoordinates?.latitude ||
      location.coordinates?.latitude ||
      21.1702,
    longitude:
      addressToEdit?.longitude ||
      initialCoordinates?.longitude ||
      location.coordinates?.longitude ||
      72.8311,
  };

  const [coords, setCoords] = useState(defaultCoords);
  const [addressType, setAddressType] = useState<"HOME" | "WORK" | "OTHER">("HOME");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState(location.city || "Ahmedabad");
  const [state, setState] = useState(location.state || "Gujarat");
  const [pincode, setPincode] = useState(location.pincode || "380015");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search locality / society bar above the map
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Store & delivery ETA resolved from map location
  const [storeInfo, setStoreInfo] = useState<{
    storeName?: string;
    deliveryEtaMinutes?: number;
  }>({
    storeName: location.darkStoreName || "Express Dark Store",
    deliveryEtaMinutes: location.deliveryEtaMinutes || 10,
  });

  // Sync state whenever dialog opens or addressToEdit changes
  useEffect(() => {
    if (open) {
      if (addressToEdit) {
        const typeNormalized = addressToEdit.type?.toUpperCase();
        setAddressType(
          typeNormalized === "WORK" ? "WORK" : typeNormalized === "OTHER" ? "OTHER" : "HOME"
        );
        setRecipientName(addressToEdit.recipientName || user?.name || "");
        setRecipientPhone(addressToEdit.phone || user?.phone || "");
        setAddressLine1(addressToEdit.addressLine1 || "");
        setAddressLine2(addressToEdit.addressLine2 || "");
        setLandmark(addressToEdit.landmark || "");
        setCity(addressToEdit.city || location.city || "Ahmedabad");
        setState(addressToEdit.state || location.state || "Gujarat");
        setPincode(addressToEdit.pincode || location.pincode || "380015");

        if (addressToEdit.latitude && addressToEdit.longitude) {
          setCoords({
            latitude: Number(addressToEdit.latitude),
            longitude: Number(addressToEdit.longitude),
          });
        }
      } else {
        setAddressType("HOME");
        setRecipientName(user?.name || "");
        setRecipientPhone(user?.phone || "");
        setAddressLine1("");
        setAddressLine2(location.society || location.area || "");
        setLandmark("");
        setCity(location.city || "Ahmedabad");
        setState(location.state || "Gujarat");
        setPincode(location.pincode || "380015");

        if (initialCoordinates) {
          setCoords(initialCoordinates);
        } else if (location.coordinates) {
          setCoords(location.coordinates);
        }
      }
    }
  }, [open, addressToEdit, initialCoordinates, location, user]);

  // Handle location update from InteractiveMap (pin drag, click, or GPS locate me)
  const handleMapLocationSelect = useCallback(
    (result: MapLocationResult) => {
      setCoords(result.coordinates);

      if (result.city) setCity(result.city);
      if (result.state) setState(result.state);
      if (result.pincode) setPincode(result.pincode);

      const resolvedArea = result.society || result.area || "";
      if (resolvedArea) {
        setAddressLine2((prev) => (prev ? prev : resolvedArea));
      }

      if (result.darkStoreName) {
        setStoreInfo({
          storeName: result.darkStoreName,
          deliveryEtaMinutes: result.deliveryEtaMinutes || 10,
        });
      }
    },
    []
  );

  // Search address / locality query
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearchingLocation(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        const firstMatch = Array.isArray(data) ? data[0] : data?.locations?.[0] || data;
        if (firstMatch?.coordinates) {
          setCoords(firstMatch.coordinates);
          if (firstMatch.city) setCity(firstMatch.city);
          if (firstMatch.state) setState(firstMatch.state);
          if (firstMatch.pincode) setPincode(firstMatch.pincode);
          if (firstMatch.society || firstMatch.area) {
            setAddressLine2(firstMatch.society || firstMatch.area);
          }
          toast.success(`Map centered on: ${firstMatch.society || firstMatch.area || query}`);
        } else {
          toast.info("No matching coordinates found. Please tap on the map to pin.");
        }
      } else {
        toast.error("Location search failed. Please adjust pin manually on map.");
      }
    } catch (err) {
      console.warn("Search location failed:", err);
      toast.error("Could not search location. Please use map pin.");
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Trigger GPS detection manually
  const handleTriggerGPS = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ latitude, longitude });
        toast.success("Current location detected!");
      },
      () => {
        toast.error("Could not access GPS. Please pin your location on the map.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      toast.error("Please enter recipient name");
      return;
    }
    if (!recipientPhone.trim() || recipientPhone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    if (!addressLine1.trim()) {
      toast.error("Please enter house/flat/building details");
      return;
    }

    setIsSubmitting(true);
    try {
      const resolved = await locationService.resolveHierarchyUuids({
        areaName: addressLine2 || location.area || "Express Area",
        cityName: city,
      });

      let savedId = addressToEdit?.id || `addr_${Date.now()}`;

      if (isEditMode && addressToEdit?.id && isUuid(addressToEdit.id)) {
        // Edit existing server address
        await updateAddressMutation.mutateAsync({
          addressId: addressToEdit.id,
          payload: {
            address_type: addressType,
            recipient_name: recipientName.trim(),
            recipient_phone: recipientPhone.trim(),
            address_line_1: addressLine1.trim(),
            address_line_2: addressLine2.trim() || undefined,
            landmark: landmark.trim() || undefined,
            latitude: String(coords.latitude),
            longitude: String(coords.longitude),
            ...(isUuid(resolved.areaId) && resolved.areaId ? { area_id: resolved.areaId } : {}),
            ...(isUuid(resolved.cityId) && resolved.cityId ? { city_id: resolved.cityId } : {}),
            ...(isUuid(resolved.stateId) && resolved.stateId ? { state_id: resolved.stateId } : {}),
            ...(isUuid(resolved.countryId) && resolved.countryId ? { country_id: resolved.countryId } : {}),
            ...(isUuid(resolved.pincodeId) && resolved.pincodeId ? { pincode_id: resolved.pincodeId } : {}),
          },
        });
        toast.success("Delivery address updated successfully!");
      } else {
        // Create new address
        let createdAddress: any = null;
        if (
          isUuid(resolved.areaId) &&
          isUuid(resolved.cityId) &&
          isUuid(resolved.stateId) &&
          isUuid(resolved.countryId)
        ) {
          createdAddress = await createAddressMutation.mutateAsync({
            address_type: addressType,
            recipient_name: recipientName.trim(),
            recipient_phone: recipientPhone.trim(),
            address_line_1: addressLine1.trim(),
            address_line_2: addressLine2.trim() || undefined,
            landmark: landmark.trim() || undefined,
            area_id: resolved.areaId!,
            city_id: resolved.cityId!,
            state_id: resolved.stateId!,
            country_id: resolved.countryId!,
            pincode_id: isUuid(resolved.pincodeId) ? resolved.pincodeId! : null,
            latitude: String(coords.latitude),
            longitude: String(coords.longitude),
            is_default: true,
          });
        }
        savedId = createdAddress?.id || savedId;
        toast.success("Delivery address saved successfully!");
      }

      const returnAddress: AddressCardData = {
        id: savedId,
        type: addressType,
        recipientName: recipientName.trim(),
        phone: recipientPhone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        landmark: landmark.trim() || undefined,
        city,
        state,
        pincode,
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      if (onAddressSaved) {
        onAddressSaved(returnAddress);
      }
      if (onAddressCreated) {
        onAddressCreated(returnAddress);
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save address");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full bg-white dark:bg-zinc-900 rounded-3xl p-0 overflow-hidden shadow-2xl border border-zinc-200/80 dark:border-zinc-800 focus:outline-none">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 text-[#0c831f] flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                {isEditMode ? "Edit Delivery Location" : "Pin Exact Delivery Location"}
              </DialogTitle>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Drag marker or click on map to pinpoint your exact doorstep
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close dialog"
            className="h-8 w-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 2-Column Responsive Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 max-h-[80vh] overflow-y-auto">
          {/* Left Column: Interactive Map & Location Search */}
          <div className="md:col-span-7 p-4 sm:p-5 flex flex-col gap-3 bg-zinc-50/50 dark:bg-zinc-950/20 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800">
            {/* Search locality input bar */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search apartment, society or street..."
                  className="pl-9 pr-8 h-10 text-xs rounded-xl bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Button
                type="submit"
                size="sm"
                disabled={isSearchingLocation}
                className="h-10 px-3.5 bg-[#0c831f] hover:bg-[#0a6f1a] text-white text-xs font-semibold rounded-xl shrink-0 cursor-pointer shadow-xs"
              >
                {isSearchingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Find"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTriggerGPS}
                title="Detect my current location"
                className="h-10 px-3 rounded-xl border-zinc-200 dark:border-zinc-700 text-[#0c831f] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs shrink-0 cursor-pointer"
              >
                <Navigation className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">GPS</span>
              </Button>
            </form>

            {/* Map Container */}
            <div className="w-full flex-1 min-h-[320px] sm:min-h-[380px] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm relative">
              <InteractiveMap
                initialCoordinates={coords}
                onLocationSelect={handleMapLocationSelect}
                className="w-full h-full min-h-[320px] sm:min-h-[380px]"
              />
            </div>
          </div>

          {/* Right Column: Complete Address Details Form */}
          <div className="md:col-span-5 p-5 sm:p-6 flex flex-col justify-between bg-white dark:bg-zinc-900">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dark Store & Delivery ETA Banner */}
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200/80 dark:border-emerald-800/60">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#0c831f] text-white flex items-center justify-center shrink-0">
                    <Zap className="h-3.5 w-3.5 fill-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-100">
                      {storeInfo.storeName || "Express Store"}
                    </p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
                      Delivery in ~{storeInfo.deliveryEtaMinutes || 10} mins
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0c831f] text-white">
                  Active
                </span>
              </div>

              {/* Address Type Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Save address as *
                </label>
                <div className="flex gap-2">
                  {[
                    { type: "HOME" as const, label: "Home", icon: Home },
                    { type: "WORK" as const, label: "Work", icon: Briefcase },
                    { type: "OTHER" as const, label: "Other", icon: MapPin },
                  ].map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAddressType(type)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        addressType === type
                          ? "border-[#0c831f] bg-emerald-50 dark:bg-emerald-950/50 text-[#0c831f] shadow-2xs font-bold"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Details */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Recipient Name *
                  </label>
                  <Input
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Full Name"
                    className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-700 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Phone Number *
                  </label>
                  <Input
                    required
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) =>
                      setRecipientPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="10-digit number"
                    className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-700 font-medium"
                  />
                </div>
              </div>

              {/* Flat / House No */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                  Flat / House / Building Name *
                </label>
                <Input
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="e.g. Flat 301, Silver Heights"
                  className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-700 font-medium"
                />
              </div>

              {/* Area / Society (auto-filled from pin) */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                  Area / Society / Locality
                </label>
                <Input
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="e.g. Bodakdev, SG Highway"
                  className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-700 font-medium"
                />
              </div>

              {/* Landmark & Pincode */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Landmark (Optional)
                  </label>
                  <Input
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near City Center"
                    className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-700 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    Pincode *
                  </label>
                  <Input
                    required
                    value={pincode}
                    onChange={(e) =>
                      setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="380015"
                    className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-700 font-medium"
                  />
                </div>
              </div>

              {/* City & State (Read-only or synced) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    City
                  </label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-700 font-medium bg-zinc-50/50 dark:bg-zinc-800/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                    State
                  </label>
                  <Input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-700 font-medium bg-zinc-50/50 dark:bg-zinc-800/50"
                  />
                </div>
              </div>

              {/* Dialog Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="h-10 text-xs font-medium rounded-xl border-zinc-200 dark:border-zinc-700 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-5 bg-[#0c831f] hover:bg-[#0a6f1a] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isEditMode ? (
                    "Update Address"
                  ) : (
                    "Save & Deliver Here"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
