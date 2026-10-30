"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAtom } from "jotai";
import {
  X,
  Search,
  MapPin,
  Navigation,
  Home,
  Building,
  Bed,
  CheckCircle2,
  Loader2,
  Zap,
  Globe2,
  Compass,
  Building2,
  Hash,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SavedAddress, DeliveryLocation } from "@/types/location";
import { userProfileAtom } from "@/stores";
import {
  useCountriesQuery,
  useStatesQuery,
  useCitiesQuery,
  usePincodesQuery,
  useAreasQuery,
} from "@/queries/location/use-location-hierarchy-queries";
import { locationService } from "@/lib/api/location-service";
import { toast } from "sonner";
import type { MapLocationResult } from "@/components/location/interactive-map";

// Dynamically import InteractiveMap (client-side Leaflet)
const InteractiveMap = dynamic(
  () => import("@/components/location/interactive-map"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[360px] flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-2xl">
        <Loader2 className="h-8 w-8 text-[#0c831f] animate-spin mb-2" />
        <span className="text-xs font-semibold">Loading Live Map...</span>
      </div>
    ),
  }
);

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (addressData: Partial<SavedAddress> & {
    floor?: string;
    houseNo?: string;
    countryId?: string;
    stateId?: string;
    cityId?: string;
    pincodeId?: string;
    areaId?: string;
  }) => void;
  initialData?: SavedAddress | null;
  detectedLocation?: DeliveryLocation | null;
  isSaving?: boolean;
}

export function AddressModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  detectedLocation,
  isSaving = false,
}: AddressModalProps) {
  const [user] = useAtom(userProfileAtom);
  const [addressType, setAddressType] = useState<"home" | "work" | "hotel" | "other">(
    (initialData?.type as any) || "home"
  );
  const [houseNo, setHouseNo] = useState("");
  const [floor, setFloor] = useState("");
  const [landmark, setLandmark] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [searchMapQuery, setSearchMapQuery] = useState("");

  // Map coordinates
  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number }>(
    detectedLocation?.coordinates || initialData?.coordinates || { latitude: 21.1702, longitude: 72.8311 }
  );

  // Dynamic Geographic Hierarchy State
  const [selectedCountryId, setSelectedCountryId] = useState<string>("");
  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedPincodeId, setSelectedPincodeId] = useState<string>("");
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [customAreaName, setCustomAreaName] = useState<string>("");

  const [resolvedStoreInfo, setResolvedStoreInfo] = useState<{
    storeName?: string;
    deliveryEtaMinutes?: number;
  }>({});

  // 1. Fetch Countries (defaults to India)
  const { data: countries = [], isLoading: isLoadingCountries } = useCountriesQuery();

  // Set default country when loaded
  useEffect(() => {
    if (countries.length > 0 && !selectedCountryId) {
      const india = countries.find((c) => c.code === "IN" || c.name.toLowerCase().includes("india"));
      setSelectedCountryId(india ? india.id : countries[0].id);
    }
  }, [countries, selectedCountryId]);

  // 2. Fetch States for Country
  const { data: states = [], isLoading: isLoadingStates } = useStatesQuery(selectedCountryId);

  // Set state ONLY if detected from location or initialData
  useEffect(() => {
    if (states.length > 0) {
      const targetStateName = (detectedLocation?.state || initialData?.stateName || "").trim().toLowerCase();
      if (!targetStateName) return;

      // 1. Exact name match
      let matched = states.find((s) => s.name.toLowerCase() === targetStateName);
      // 2. Exact code match
      if (!matched) {
        matched = states.find((s) => s.code && s.code.toLowerCase() === targetStateName);
      }
      // 3. Name contains targetStateName
      if (!matched) {
        matched = states.find((s) => s.name.toLowerCase().includes(targetStateName));
      }

      if (matched && (!selectedStateId || !states.some((s) => s.id === selectedStateId))) {
        setSelectedStateId(matched.id);
      }
    }
  }, [states, selectedStateId, detectedLocation?.state, initialData?.stateName]);

  // 3. Fetch Cities for State
  const { data: cities = [], isLoading: isLoadingCities } = useCitiesQuery(selectedStateId);

  // Set city ONLY if detected from location, initialData, or formattedAddress
  useEffect(() => {
    if (cities.length > 0) {
      let targetCityName = (detectedLocation?.city || initialData?.city || "").trim().toLowerCase();

      // Scan formattedAddress for city name if empty
      if (!targetCityName && detectedLocation?.formattedAddress) {
        const addrLower = detectedLocation.formattedAddress.toLowerCase();
        const found = cities.find((c) => addrLower.includes(c.name.toLowerCase()));
        if (found) targetCityName = found.name.toLowerCase();
      }

      if (!targetCityName) return;

      const matched =
        cities.find((c) => c.name.toLowerCase() === targetCityName) ||
        cities.find(
          (c) =>
            c.name.toLowerCase().includes(targetCityName) ||
            targetCityName.includes(c.name.toLowerCase())
        );

      if (matched && (!selectedCityId || !cities.some((c) => c.id === selectedCityId))) {
        setSelectedCityId(matched.id);
      }
    }
  }, [cities, selectedCityId, detectedLocation?.city, detectedLocation?.formattedAddress, initialData?.city]);

  // 4. Fetch Pincodes for City
  const { data: pincodes = [], isLoading: isLoadingPincodes } = usePincodesQuery(selectedCityId);

  // Set Pincode ONLY if detected from location or initialData
  useEffect(() => {
    if (pincodes.length > 0) {
      let targetPincode = (detectedLocation?.pincode || initialData?.pincode || "").trim();
      if (!targetPincode && detectedLocation?.formattedAddress) {
        const match = detectedLocation.formattedAddress.match(/\b([1-9][0-9]{5})\b/);
        if (match) targetPincode = match[1];
      }
      if (!targetPincode) return;

      const matchedPin = pincodes.find((p) => p.code === targetPincode);
      if (matchedPin && (!selectedPincodeId || !pincodes.some((p) => p.id === selectedPincodeId))) {
        setSelectedPincodeId(matchedPin.id);
      }
    }
  }, [pincodes, detectedLocation?.pincode, detectedLocation?.formattedAddress, initialData?.pincode, selectedPincodeId]);

  // 5. Fetch all Areas for City
  const { data: areas = [], isLoading: isLoadingAreas } = useAreasQuery({
    city_id: selectedCityId || undefined,
  });

  // Set Area ONLY if detected from location or initialData
  useEffect(() => {
    if (areas.length > 0) {
      const targetArea = (detectedLocation?.area || detectedLocation?.society || initialData?.area || "").trim().toLowerCase();
      if (!targetArea) return;

      const matchedArea =
        areas.find((a) => a.name.toLowerCase() === targetArea) ||
        areas.find(
          (a) =>
            a.name.toLowerCase().includes(targetArea) ||
            targetArea.includes(a.name.toLowerCase())
        );

      if (matchedArea && (!selectedAreaId || !areas.some((a) => a.id === selectedAreaId))) {
        setSelectedAreaId(matchedArea.id);
        setCustomAreaName(matchedArea.name);
        if (matchedArea.pincode_id && !selectedPincodeId) {
          setSelectedPincodeId(matchedArea.pincode_id);
        }
      }
    }
  }, [areas, detectedLocation?.area, detectedLocation?.society, initialData?.area, selectedPincodeId, selectedAreaId]);

  // Selected State, City, Pincode, Area labels
  const selectedState = useMemo(() => states.find((s) => s.id === selectedStateId), [states, selectedStateId]);
  const selectedCity = useMemo(() => cities.find((c) => c.id === selectedCityId), [cities, selectedCityId]);
  const selectedPincode = useMemo(() => pincodes.find((p) => p.id === selectedPincodeId), [pincodes, selectedPincodeId]);
  const selectedArea = useMemo(() => areas.find((a) => a.id === selectedAreaId), [areas, selectedAreaId]);

  // Auto-resolve store whenever area changes
  useEffect(() => {
    if (selectedAreaId) {
      locationService.resolveStoreByArea(selectedAreaId).then((storeRes) => {
        if (storeRes) {
          setResolvedStoreInfo({
            storeName: storeRes.storeName,
            deliveryEtaMinutes: storeRes.deliveryEtaMinutes,
          });
        }
      });
    }
  }, [selectedAreaId]);

  // Initialize or update form state on open
  useEffect(() => {
    if (!isOpen) return;

    if (detectedLocation) {
      const locArea = [detectedLocation.society || detectedLocation.area, detectedLocation.city]
        .filter(Boolean)
        .join(", ");
      setCustomAreaName(detectedLocation.society || detectedLocation.area || "");
      setHouseNo(detectedLocation.houseNo || "");
      setFloor("");
      setLandmark(detectedLocation.landmark || "");
      setSearchMapQuery(detectedLocation.formattedAddress || locArea || "");
      setName(user?.name || initialData?.receiverName || "Customer");
      setPhone(user?.phone || initialData?.receiverPhone || "");
      setAddressType((initialData?.type as any) || "home");

      if (detectedLocation.coordinates) {
        setCurrentCoords(detectedLocation.coordinates);
      }

      if (detectedLocation.darkStoreName) {
        setResolvedStoreInfo({
          storeName: detectedLocation.darkStoreName,
          deliveryEtaMinutes: detectedLocation.deliveryEtaMinutes || 8,
        });
      }
    } else if (initialData) {
      setAddressType((initialData.type as any) || "home");
      setHouseNo(initialData.addressLine?.split(",")[0] || "");
      setCustomAreaName(initialData.area || "");
      setLandmark(initialData.landmark || "");
      setName(initialData.receiverName || user?.name || "Customer");
      setPhone(initialData.receiverPhone || user?.phone || "");
      setSearchMapQuery(initialData.addressLine || initialData.area || "");
      if (initialData.coordinates) {
        setCurrentCoords(initialData.coordinates);
      }
      if (initialData.stateId) setSelectedStateId(initialData.stateId);
      if (initialData.cityId) setSelectedCityId(initialData.cityId);
      if (initialData.pincodeId) setSelectedPincodeId(initialData.pincodeId);
      if (initialData.areaId) setSelectedAreaId(initialData.areaId);
    } else {
      setAddressType("home");
      setHouseNo("");
      setFloor("");
      setCustomAreaName("");
      setLandmark("");
      setName(user?.name || "Customer");
      setPhone(user?.phone || "");
    }
  }, [detectedLocation, initialData, isOpen, user]);

  // Handle Interactive Pin on Map
  const handleMapPinSelect = useCallback(
    (result: MapLocationResult) => {
      setCurrentCoords(result.coordinates);
      setSearchMapQuery(result.formattedAddress);

      if (result.society || result.area) {
        setCustomAreaName(result.society || result.area || "");
      }

      // Auto-match City if result.city is available
      if (result.city && cities.length > 0) {
        const matchedCity = cities.find((c) =>
          c.name.toLowerCase().includes(result.city!.toLowerCase())
        );
        if (matchedCity) {
          setSelectedCityId(matchedCity.id);
        }
      }

      // Auto-match Pincode if result.pincode is available
      if (result.pincode && pincodes.length > 0) {
        const matchedPin = pincodes.find((p) => p.code === result.pincode);
        if (matchedPin) {
          setSelectedPincodeId(matchedPin.id);
        }
      }

      // Auto-match Area if result.area is available
      if (result.area && areas.length > 0) {
        const matchedArea = areas.find((a) =>
          a.name.toLowerCase().includes(result.area!.toLowerCase())
        );
        if (matchedArea) {
          setSelectedAreaId(matchedArea.id);
        }
      }

      if (result.darkStoreName) {
        setResolvedStoreInfo({
          storeName: result.darkStoreName,
          deliveryEtaMinutes: result.deliveryEtaMinutes || 8,
        });
      }

      toast.success(`📍 Pinned: ${result.society || result.area || "Location"}, ${result.pincode || ""}`);
    },
    [cities, pincodes, areas]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseNo.trim()) {
      toast.error("Please enter Flat/House no/Building name");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    const effectiveAreaName = selectedArea?.name || customAreaName.trim() || "";
    const effectiveCityName = selectedCity?.name || detectedLocation?.city || "";
    const effectivePincode = selectedPincode?.code || detectedLocation?.pincode || "";
    const effectiveStateName = selectedState?.name || detectedLocation?.state || "";

    const fullAddress = [
      houseNo.trim(),
      floor.trim() ? `${floor.trim()} Floor` : "",
      landmark.trim(),
      effectiveAreaName,
      effectiveCityName,
      effectivePincode,
    ]
      .filter(Boolean)
      .join(", ");

    onSave({
      id: initialData?.id || `addr-${Date.now()}`,
      type: addressType === "hotel" ? "other" : addressType,
      title:
        addressType === "home"
          ? "Home"
          : addressType === "work"
          ? "Work"
          : addressType === "hotel"
          ? "Hotel"
          : name.trim() || "Other",
      addressLine: fullAddress,
      houseNo: houseNo.trim(),
      floor: floor.trim(),
      area: effectiveAreaName,
      city: effectiveCityName,
      pincode: effectivePincode,
      stateName: effectiveStateName,
      countryId: selectedCountryId || undefined,
      stateId: selectedStateId || undefined,
      cityId: selectedCityId || undefined,
      pincodeId: selectedPincodeId || undefined,
      areaId: selectedAreaId || undefined,
      coordinates: currentCoords,
      landmark: landmark.trim(),
      receiverName: name.trim(),
      receiverPhone: phone.trim(),
      isDefault: initialData?.isDefault ?? true,
    });
  };

  const displayStoreName = resolvedStoreInfo.storeName || detectedLocation?.darkStoreName || "";
  const displayEta = resolvedStoreInfo.deliveryEtaMinutes || detectedLocation?.deliveryEtaMinutes || 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Set hideCloseButton={true} to eliminate the duplicate close button */}
      <DialogContent
        hideCloseButton={true}
        className="max-w-4xl p-0 overflow-hidden rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#181818] shadow-2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[600px]">
          {/* Left Column: Interactive Real Map Section with Pin Drop & Live Location Feedback */}
          <div className="relative bg-[#e9ecef] dark:bg-[#202020] flex flex-col justify-between p-4 overflow-hidden border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800">
            {/* Top Search & Real-time Pin Helper */}
            <div className="relative z-10 w-full mb-3">
              <div className="flex items-center gap-2 bg-white/95 dark:bg-[#282828]/95 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-md border border-neutral-200/90 dark:border-neutral-700">
                <Search className="h-4 w-4 text-[#0c831f] shrink-0" />
                <input
                  type="text"
                  value={searchMapQuery}
                  onChange={(e) => setSearchMapQuery(e.target.value)}
                  placeholder="Pin or search locality on map..."
                  className="w-full text-xs font-semibold text-neutral-800 dark:text-neutral-100 bg-transparent outline-none truncate"
                />
                {searchMapQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchMapQuery("")}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Real Interactive Map Component with Marker Drag & Click to Pin */}
            <div className="flex-1 w-full relative min-h-[340px] rounded-2xl overflow-hidden shadow-inner border border-neutral-200 dark:border-neutral-700">
              <InteractiveMap
                initialCoordinates={currentCoords}
                onLocationSelect={handleMapPinSelect}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Right Column: Enter Complete Address Form with Dynamic State / City / Pincode / Area */}
          <div className="p-5 sm:p-6 flex flex-col justify-between bg-white dark:bg-[#181818] overflow-y-auto max-h-[85vh]">
            <div className="space-y-4">
              {/* Header with ONLY ONE clean, modern close button */}
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white tracking-tight">
                    Enter complete address
                  </h2>
                  <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                    Location state & delivery area auto-synced with nearest store
                  </p>
                </div>
                {/* Single, perfectly positioned Close button */}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close address modal"
                  className="h-8 w-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Verified Dark Store Fulfillment Banner */}
              <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100/60 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200/80 dark:border-emerald-800/60">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Zap className="h-3.5 w-3.5 fill-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-100">
                      {displayStoreName}
                    </p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
                      Estimated delivery: ~{displayEta} mins
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0c831f] text-white">
                  Active
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Save Address As Category Pills */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                    Save address as *
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: "home", label: "Home", icon: Home },
                      { id: "work", label: "Work", icon: Building },
                      { id: "hotel", label: "Hotel", icon: Bed },
                      { id: "other", label: "Other", icon: MapPin },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = addressType === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setAddressType(item.id as any)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#0c831f] border-[#0c831f] text-white shadow-sm shadow-emerald-500/20"
                              : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* State & City Cascading Row */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                      <span>State *</span>
                      {isLoadingStates && <Loader2 className="h-3 w-3 animate-spin text-[#0c831f]" />}
                    </label>
                    <select
                      value={selectedStateId}
                      onChange={(e) => {
                        setSelectedStateId(e.target.value);
                        setSelectedCityId("");
                        setSelectedPincodeId("");
                        setSelectedAreaId("");
                      }}
                      className="w-full h-9 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#202020] px-2.5 text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#0c831f] focus:ring-1 focus:ring-[#0c831f] transition-all cursor-pointer"
                    >
                      <option value="">Select State</option>
                      {states.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.code ? `(${s.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                      <span>City *</span>
                      {isLoadingCities && <Loader2 className="h-3 w-3 animate-spin text-[#0c831f]" />}
                    </label>
                    <select
                      value={selectedCityId}
                      onChange={(e) => {
                        setSelectedCityId(e.target.value);
                        setSelectedPincodeId("");
                        setSelectedAreaId("");
                      }}
                      className="w-full h-9 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#202020] px-2.5 text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#0c831f] focus:ring-1 focus:ring-[#0c831f] transition-all cursor-pointer"
                    >
                      <option value="">Select City</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pincode & Area Cascading Row (Auto-fill with backend list) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3 text-[#0c831f]" /> Pincode *
                      </span>
                      {isLoadingPincodes && <Loader2 className="h-3 w-3 animate-spin text-[#0c831f]" />}
                    </label>
                    <select
                      value={selectedPincodeId}
                      onChange={(e) => {
                        const pinId = e.target.value;
                        setSelectedPincodeId(pinId);
                        const matchedArea = areas.find((a) => a.pincode_id === pinId);
                        if (matchedArea) {
                          setSelectedAreaId(matchedArea.id);
                          setCustomAreaName(matchedArea.name);
                        }
                      }}
                      className="w-full h-9 text-xs font-bold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#202020] px-2.5 text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#0c831f] focus:ring-1 focus:ring-[#0c831f] transition-all cursor-pointer"
                    >
                      <option value="">Select Pincode</option>
                      {pincodes.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#0c831f]" /> Service Area *
                      </span>
                      {isLoadingAreas && <Loader2 className="h-3 w-3 animate-spin text-[#0c831f]" />}
                    </label>
                    <select
                      value={selectedAreaId}
                      onChange={(e) => {
                        const areaId = e.target.value;
                        setSelectedAreaId(areaId);
                        const matched = areas.find((a) => a.id === areaId);
                        if (matched) {
                          setCustomAreaName(matched.name);
                          if (matched.pincode_id) {
                            setSelectedPincodeId(matched.pincode_id);
                          }
                        }
                      }}
                      className="w-full h-9 text-xs font-bold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#202020] px-2.5 text-neutral-800 dark:text-neutral-100 outline-none focus:border-[#0c831f] focus:ring-1 focus:ring-[#0c831f] transition-all cursor-pointer"
                    >
                      <option value="">Select Service Area</option>
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Flat / House No / Building Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                    Flat / House no / Building name *
                  </label>
                  <Input
                    value={houseNo}
                    onChange={(e) => setHouseNo(e.target.value)}
                    placeholder="e.g. Flat 302, Green Valley Apartments"
                    className="h-9 text-xs font-medium rounded-xl border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#202020]"
                    required
                  />
                </div>

                {/* Floor Optional & Landmark */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                      Floor (optional)
                    </label>
                    <Input
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      placeholder="e.g. 3rd Floor"
                      className="h-9 text-xs rounded-xl border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#202020]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                      Landmark (optional)
                    </label>
                    <Input
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Star Bazaar"
                      className="h-9 text-xs rounded-xl border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#202020]"
                    />
                  </div>
                </div>

                {/* Recipient Details: Name & Phone */}
                <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                      Receiver Name *
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Yash Patel"
                      className="h-9 text-xs font-medium rounded-xl border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#202020]"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                      Phone Number
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="h-9 text-xs font-medium rounded-xl border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#202020]"
                    />
                  </div>
                </div>

                {/* Big Solid Green Save Address Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="w-full h-11 bg-gradient-to-r from-[#0c831f] to-[#0a6f1a] hover:from-[#0a6f1a] hover:to-[#085a15] text-white font-black text-xs sm:text-sm rounded-xl cursor-pointer shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.99] disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving Address...</span>
                      </>
                    ) : (
                      <span>Save Address & Proceed</span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
