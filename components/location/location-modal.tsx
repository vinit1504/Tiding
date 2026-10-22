"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Navigation,
  Search,
  Building,
  Home,
  Briefcase,
  Loader2,
  X,
  Compass,
  CheckCircle2,
  Check,
  Edit3,
  Store,
  AlertTriangle,
  Plus,
  Bookmark,
  ChevronRight,
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
  isAuthDrawerOpenAtom,
  userProfileAtom,
  authSessionAtom,
} from "@/stores";
import { DeliveryLocation, SavedAddress } from "@/types/location";
import { CustomerAddress } from "@/types/address";
import { useCustomerAddressesQuery, useCreateAddressMutation } from "@/queries";
import { AddressModal } from "@/components/account/address-modal";
import { resolveDeliveryStoreApi, ResolvedStoreData } from "@/queries/location/use-geocode-query";
import { useQueryClient } from "@tanstack/react-query";
import { AreaItem } from "@/lib/api/location-service";
import { toast } from "sonner";

export function LocationModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useAtom(isLocationModalOpenAtom);
  const [currentLocation, setCurrentLocation] = useAtom(persistentLocationAtom);
  const [, setHasUserSetLocation] = useAtom(hasUserSetLocationAtom);

  const [user] = useAtom(userProfileAtom);
  const [session] = useAtom(authSessionAtom);
  const [, setIsAuthDrawerOpen] = useAtom(isAuthDrawerOpenAtom);

  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DeliveryLocation[]>([]);
  const [availableAreas, setAvailableAreas] = useState<AreaItem[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const createAddressMutation = useCreateAddressMutation();

  // Fetch real saved customer addresses from profile
  const { data: savedAddresses = [] } = useCustomerAddressesQuery();
  const isAuthenticated = !!user || session.isAuthenticated;

  // Local editable form fields matching society details structure
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

  // Load available delivery areas for 1-tap store resolution without login
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    (async () => {
      try {
        setIsLoadingAreas(true);
        const { locationService } = await import("@/services/location-service");
        const areas = await locationService.getAreasByPincode();
        if (isMounted && Array.isArray(areas) && areas.length > 0) {
          setAvailableAreas(areas);
        }
      } catch (err) {
        console.warn("Failed to load delivery areas:", err);
      } finally {
        if (isMounted) setIsLoadingAreas(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

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
                    city: pin.city_name || "Surat",
                    state: "Gujarat",
                    pincode: pin.code,
                    deliveryEtaMinutes: 8,
                    isServiceable: true,
                    formattedAddress: `${pin.city_name || "Surat"} - ${pin.code}`,
                  });
                }
              }
            }
          } else {
            // Text search for areas / societies in backend
            const areas = await locationService.getAreasByPincode(undefined, cleanQuery);
            if (areas && areas.length > 0) {
              for (const a of areas) {
                results.push({
                  area: a.name,
                  society: a.name,
                  city: "Surat",
                  state: "Gujarat",
                  coordinates: {
                    latitude: Number(a.latitude) || 21.1702,
                    longitude: Number(a.longitude) || 72.8311,
                  },
                  deliveryEtaMinutes: 8,
                  isServiceable: true,
                  formattedAddress: `${a.name}, Surat, Gujarat`,
                  rawAreaId: a.id,
                } as any);
              }
            }
          }
        } catch (apiErr) {
          console.warn("Backend location search error:", apiErr);
        }

        // OpenStreetMap / Nominatim search fallback
        if (results.length === 0) {
          try {
            const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
              `${cleanQuery}, Surat, Gujarat, India`
            )}&format=json&addressdetails=1&limit=5`;

            const res = await fetch(geocodeUrl, {
              headers: { Accept: "application/json" },
            });

            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data) && data.length > 0) {
                for (const item of data) {
                  const addr = item.address || {};
                  const soc =
                    addr.residential ||
                    addr.neighbourhood ||
                    addr.suburb ||
                    addr.road ||
                    cleanQuery;
                  const lat = parseFloat(item.lat);
                  const lon = parseFloat(item.lon);

                  results.push({
                    area: soc,
                    society: soc,
                    city: addr.city || addr.town || "Surat",
                    state: addr.state || "Gujarat",
                    pincode: addr.postcode || "395009",
                    coordinates: {
                      latitude: lat,
                      longitude: lon,
                    },
                    deliveryEtaMinutes: 8,
                    isServiceable: true,
                    formattedAddress: item.display_name,
                  });
                }
              }
            }
          } catch (osmErr) {
            console.warn("Geocode fallback error:", osmErr);
          }
        }

        setSearchResults(results);
      } catch (err) {
        console.error("Search query failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Construct display string from components
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
          // Concurrently call backend store resolve and reverse-geocode
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

        // Direct Nominatim fallback if internal proxy had an issue
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
                "Vesu";

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

        // Apply detected or fallback
        if (detected) {
          const finalLocation: DeliveryLocation = {
            ...detected,
            coordinates: { latitude, longitude },
            darkStoreId: resolvedStore?.storeId || detected.darkStoreId,
            darkStoreName: resolvedStore?.storeName || detected.darkStoreName || "Tiding Express Store",
            storeAddress: resolvedStore?.storeAddress || detected.storeAddress,
            deliveryEtaMinutes: resolvedStore?.deliveryEtaMinutes || 8,
            isServiceable: resolvedStore ? resolvedStore.isServiceable : true,
            storeDistanceKm: resolvedStore?.distanceKm,
          };

          setCurrentLocation(finalLocation);
          setHouseNo(finalLocation.houseNo || "");
          setSociety(finalLocation.society || finalLocation.area || "");
          setLandmark(finalLocation.landmark || "");
          setHasUserSetLocation(true);
          setIsLocating(false);
          setIsOpen(false);
          queryClient.invalidateQueries({ queryKey: ["catalog"] });
          router.refresh();

          toast.success(
            `Delivering to ${finalLocation.society || finalLocation.area} in ${finalLocation.deliveryEtaMinutes || 8} mins!`
          );
        } else {
          // Fallback to default serviceable location
          const fallback: DeliveryLocation = {
            area: "Vesu",
            society: "Vesu Main Road",
            city: "Surat",
            state: "Gujarat",
            pincode: "395007",
            formattedAddress: "Vesu, Surat, Gujarat 395007",
            coordinates: { latitude, longitude },
            deliveryEtaMinutes: 8,
            isServiceable: true,
            darkStoreName: "Vesu Express Hub",
          };
          setCurrentLocation(fallback);
          setHouseNo("");
          setSociety("Vesu Main Road");
          setLandmark("");
          setHasUserSetLocation(true);
          setIsLocating(false);
          setIsOpen(false);
          queryClient.invalidateQueries({ queryKey: ["catalog"] });
          router.refresh();
          toast.success("Location set to Vesu, Surat (8-minute delivery zone)!");
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please allow location access or pick an area below.");
        } else if (error.code === error.TIMEOUT) {
          toast.error("Location request timed out. Please try again.");
        } else {
          toast.error("Unable to retrieve GPS location. Please choose a locality below.");
        }
      },
      { timeout: 12000, enableHighAccuracy: true, maximumAge: 0 }
    );
  }, [setCurrentLocation, setHasUserSetLocation, setIsOpen, queryClient, router]);

  // Core handler: Select an area (with or without login) -> sends area_id -> resolves dark store -> sets location -> invalidates catalog queries
  const handleSelectArea = async (area: AreaItem | DeliveryLocation) => {
    const areaId =
      (area as any).rawAreaId ||
      (area as any).areaId ||
      (area as any).area_id ||
      area.id;

    const areaName = (area as any).name || (area as any).area || "Selected Area";

    let updatedItem: DeliveryLocation = {
      areaId,
      area: areaName,
      society: areaName,
      city: (area as any).city || "Surat",
      state: "Gujarat",
      pincode: (area as any).pincode || "395006",
      formattedAddress: (area as any).formattedAddress || `${areaName}, Surat, Gujarat`,
      coordinates: (area as any).coordinates || {
        latitude: Number((area as any).latitude) || 21.2266,
        longitude: Number((area as any).longitude) || 72.8753,
      },
      deliveryEtaMinutes: 8,
      isServiceable: true,
      darkStoreName: "Express Store",
    };

    if (areaId) {
      try {
        const resolvedStore = await resolveDeliveryStoreApi({ area_id: areaId });
        if (resolvedStore) {
          updatedItem = {
            ...updatedItem,
            areaId,
            darkStoreId: resolvedStore.storeId || updatedItem.darkStoreId,
            darkStoreName: resolvedStore.storeName || updatedItem.darkStoreName,
            storeAddress: resolvedStore.storeAddress || updatedItem.storeAddress,
            deliveryEtaMinutes: resolvedStore.deliveryEtaMinutes || updatedItem.deliveryEtaMinutes,
            isServiceable: resolvedStore.isServiceable,
            storeDistanceKm: resolvedStore.distanceKm,
          };
        }
      } catch (err) {
        console.warn("Failed to resolve store by area_id:", err);
      }
    } else if ((area as any).coordinates?.latitude && (area as any).coordinates?.longitude) {
      const resolvedStore = await resolveDeliveryStoreApi((area as any).coordinates);
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

    // Invalidate product queries across the application so the catalog refetches for this dark store
    queryClient.invalidateQueries({ queryKey: ["catalog"] });
    router.refresh();

    if (updatedItem.isServiceable === false) {
      toast.warning("Notice: This address is currently outside our express delivery zone.");
    } else {
      toast.success(
        `Delivering from ${updatedItem.darkStoreName || "Express Hub"} in ${updatedItem.deliveryEtaMinutes || 8} mins!`
      );
    }
  };

  const handleSelectSearchResult = async (item: DeliveryLocation) => {
    await handleSelectArea(item);
  };

  // Select a saved address from customer account
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
      city: addr.city_name || "Ahmedabad",
      state: addr.state_name || "Gujarat",
      pincode: addr.pincode || "380054",
      formattedAddress,
      coordinates: {
        latitude: Number(addr.latitude) || 23.0375,
        longitude: Number(addr.longitude) || 72.5122,
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
    setHouseNo(updatedLocation.houseNo || "");
    setSociety(updatedLocation.society || updatedLocation.area || "");
    setLandmark(updatedLocation.landmark || "");
    setHasUserSetLocation(true);
    setIsOpen(false);
    queryClient.invalidateQueries({ queryKey: ["catalog"] });
    router.refresh();
    toast.success(
      `Delivering to ${addr.address_type === "HOME" ? "Home" : addr.address_type === "WORK" ? "Work" : "Saved Address"} (${updatedLocation.area})!`
    );
  };

  const handleAddNewAddress = () => {
    if (!isAuthenticated) {
      setIsOpen(false);
      setIsAuthDrawerOpen(true);
      toast.info("Please login to save delivery addresses");
    } else {
      setIsAddressModalOpen(true);
    }
  };

  const handleSaveNewAddress = async (data: Partial<SavedAddress> & { floor?: string }) => {
    try {
      const created = await createAddressMutation.mutateAsync({
        address_type: (data.type?.toUpperCase() === "WORK" ? "WORK" : "HOME") as any,
        recipient_name: data.receiverName || user?.name || "Customer",
        recipient_phone: data.receiverPhone || user?.phone || "9876543210",
        address_line_1: data.addressLine?.split(",")[0]?.trim() || "House",
        address_line_2: data.area || null,
        landmark: data.landmark || null,
        area_id: "feacf6d2-53e1-40de-af4e-ddc1404c0fb7",
        city_id: "e4f80d05-6ce3-40c3-9d12-3ad6dc29bac9",
        state_id: "05efa890-b84c-44ed-b312-9ba531814aeb",
        country_id: "bb1942fd-ab4f-48a9-999f-6cebcd644e68",
        is_default: savedAddresses.length === 0,
      });

      setIsAddressModalOpen(false);
      toast.success("New address added successfully!");
      if (created) {
        handleSelectSavedAddress(created);
      }
    } catch (err) {
      console.warn("Backend address creation error, applying local fallback:", err);
      const parts = [data.addressLine, data.area, data.city, data.pincode].filter(Boolean);
      const newLoc: DeliveryLocation = {
        area: data.area || data.addressLine || "New Address",
        houseNo: data.addressLine?.split(",")[0]?.trim() || "",
        society: data.area || "",
        landmark: data.landmark || "",
        city: data.city || "Ahmedabad",
        state: "Gujarat",
        pincode: data.pincode || "380054",
        formattedAddress: parts.join(", "),
        deliveryEtaMinutes: 8,
        isServiceable: true,
      };
      (newLoc as any).addressType = data.type?.toUpperCase();
      setCurrentLocation(newLoc);
      setHouseNo(newLoc.houseNo || "");
      setSociety(newLoc.society || newLoc.area || "");
      setLandmark(newLoc.landmark || "");
      setHasUserSetLocation(true);
      setIsAddressModalOpen(false);
      setIsOpen(false);
      toast.success(`Delivering to ${newLoc.area}!`);
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
    queryClient.invalidateQueries({ queryKey: ["catalog"] });
    router.refresh();
    toast.success(`Delivering to ${computedArea}!`);
  };

  const handleLoginClick = () => {
    setIsOpen(false);
    setIsAuthDrawerOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden border-[var(--border)] bg-[var(--surface)] shadow-2xl rounded-2xl sm:rounded-3xl">
        {/* Header Section */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] space-y-3 bg-[var(--surface)]">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2 text-[#0c831f]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[#0c831f]">
                <MapPin className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-bold text-[var(--text-primary)]">
                Select Your Delivery Location
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-[var(--text-secondary)]">
              Choose your doorstep address for express grocery delivery
            </DialogDescription>
          </DialogHeader>

          {/* GPS Auto-Detect Button */}
          <Button
            onClick={handleDetectLocation}
            disabled={isLocating}
            className="w-full h-10 bg-[#0c831f] hover:bg-[#0a6f1a] text-white flex items-center justify-center gap-2 font-bold text-xs shadow-xs transition-all active:scale-[0.99] cursor-pointer rounded-xl"
          >
            {isLocating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Detecting precise location via GPS...</span>
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 fill-white/20" />
                <span>Use Current Location (GPS)</span>
              </>
            )}
          </Button>

          {/* Search Input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search society, building, area or pincode..."
              className="pl-9 pr-8 h-9 text-xs bg-[var(--surface-secondary)]/60 border-[var(--border)] focus:bg-[var(--surface)] rounded-xl"
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
        </div>

        {/* Scrollable Body Containing All Proper Display Sections */}
        <div className="max-h-[58vh] overflow-y-auto px-4 sm:px-5 py-3 space-y-4">
          {searchQuery.trim().length > 0 ? (
            /* Search Results View */
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1">
                Matching Societies & Locations
              </p>

              {isSearching ? (
                <div className="p-8 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#0c831f]" />
                  <span>Searching societies & areas...</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((item, idx) => (
                  <button
                    key={`${item.formattedAddress}-${idx}`}
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-colors cursor-pointer border border-transparent hover:border-[#0c831f]/30 hover:bg-[#0c831f]/5 group"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface-secondary)] text-[var(--text-muted)] shrink-0 group-hover:text-[#0c831f] group-hover:bg-[#0c831f]/10 transition-colors mt-0.5">
                      <Building className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[#0c831f] truncate">
                        {item.area}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 mt-0.5 leading-snug">
                        {item.formattedAddress}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                  No matching societies found. Try entering area or pincode.
                </div>
              )}
            </div>
          ) : (
            <>
              {/* SECTION 1: Active / Current Delivery Location Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                    <span className="flex h-2 w-2 rounded-full bg-[#0c831f] animate-pulse" />
                    <span>Current Delivery Location</span>
                  </div>
                  {currentLocation.isServiceable !== false ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#0c831f] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      ⚡ {currentLocation.deliveryEtaMinutes || 8} Mins
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                      Unavailable
                    </span>
                  )}
                </div>

                <div
                  className={`rounded-2xl border p-3.5 space-y-2.5 transition-all ${
                    currentLocation.isServiceable !== false
                      ? "border-emerald-500/30 bg-emerald-50/15 dark:bg-emerald-950/10 shadow-xs"
                      : "border-amber-300 bg-amber-50/40 dark:bg-amber-950/20"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 mt-0.5 ${
                        currentLocation.isServiceable !== false
                          ? "bg-emerald-100 text-[#0c831f]"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      <Home className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs sm:text-sm font-black text-[var(--text-primary)] truncate">
                          {computeBlinkitArea(houseNo, society, landmark)}
                        </h4>
                        <span className="text-[10px] font-extrabold text-[#0c831f] shrink-0 uppercase tracking-wider">
                          Active
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-2 leading-relaxed">
                        {currentLocation.formattedAddress}
                      </p>

                      {/* Store Fulfilled Information */}
                      {currentLocation.darkStoreName && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-[var(--border)]/60 text-[11px]">
                          <span className="inline-flex items-center gap-1 font-semibold text-[#0c831f] bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">
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
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                          <span>Our dark stores do not service this location yet. Please select an alternate area.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline Flat / Society Refinement Toggle */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingSociety((prev) => !prev)}
                      className="text-[11px] font-bold text-[#0c831f] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>{isEditingSociety ? "Hide flat/society details" : "Add or edit Flat / Society details"}</span>
                    </button>
                  </div>

                  {isEditingSociety && (
                    <div className="mt-2 pt-2.5 border-t border-[var(--border)] space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                            Shop / Flat No.
                          </label>
                          <Input
                            value={houseNo}
                            onChange={(e) => setHouseNo(e.target.value)}
                            placeholder="e.g. Flat 402"
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
                          placeholder="e.g. Near Big Bazaar"
                          className="h-8 text-xs mt-0.5 bg-[var(--surface)]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Confirm & Deliver Button */}
                  <div className="pt-2">
                    <Button
                      onClick={handleSaveAndConfirm}
                      disabled={currentLocation.isServiceable === false}
                      className="w-full h-9 bg-[#0c831f] hover:bg-[#0a6f1a] disabled:bg-gray-400 text-white font-bold text-xs flex items-center justify-center gap-2 rounded-xl cursor-pointer shadow-xs active:scale-[0.99]"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{currentLocation.isServiceable === false ? "Cannot Deliver Here" : "Confirm & Deliver to This Address"}</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Saved Addresses (Home, Work, Other) */}
              <div className="space-y-2 pt-2 border-t border-[var(--border)]/70">
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                    <Bookmark className="h-3.5 w-3.5 text-[#0c831f]" />
                    <span>Saved Addresses</span>
                    {savedAddresses.length > 0 && (
                      <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-[#0c831f]">
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

                {savedAddresses.length > 0 ? (
                  <div className="space-y-2">
                    {savedAddresses.map((addr) => {
                      const isHome = addr.address_type === "HOME";
                      const isWork = addr.address_type === "WORK";
                      const isSelected =
                        currentLocation.id === addr.id ||
                        (currentLocation as any).savedAddressId === addr.id ||
                        (currentLocation.houseNo &&
                          addr.address_line_1.toLowerCase().trim() === currentLocation.houseNo.toLowerCase().trim());

                      return (
                        <div
                          key={addr.id}
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={`group flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#0c831f] bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs"
                              : "border-[var(--border)] bg-[var(--surface)] hover:border-[#0c831f]/40 hover:bg-gray-50/70 dark:hover:bg-neutral-800/50"
                          }`}
                        >
                          {/* Type Icon */}
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 mt-0.5 ${
                              isHome
                                ? "bg-blue-50 text-blue-600"
                                : isWork
                                ? "bg-amber-50 text-amber-600"
                                : "bg-emerald-50 text-[#0c831f]"
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
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-[#0c831f] ml-auto flex items-center gap-0.5">
                                  <Check className="h-2.5 w-2.5" />
                                  Selected
                                </span>
                              )}
                            </div>

                            <p className="text-xs font-semibold text-[var(--text-secondary)] mt-0.5 truncate">
                              {addr.recipient_name} {addr.recipient_phone ? `• ${addr.recipient_phone}` : ""}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-0.5 leading-snug">
                              {[addr.address_line_1, addr.address_line_2, addr.landmark, addr.area_name, addr.city_name, addr.pincode]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Prompt when no saved addresses */
                  <div className="rounded-xl border border-dashed border-[var(--border)] p-3.5 text-center space-y-1.5 bg-[var(--surface-secondary)]/30">
                    <p className="text-xs font-medium text-[var(--text-secondary)]">
                      {isAuthenticated
                        ? "You haven't saved any doorstep addresses yet."
                        : "Sign in to view your saved addresses for 1-tap checkout."}
                    </p>
                    <button
                      type="button"
                      onClick={isAuthenticated ? handleAddNewAddress : handleLoginClick}
                      className="text-xs font-bold text-[#0c831f] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{isAuthenticated ? "Add new delivery address" : "Sign in to view saved addresses"}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Delivery Areas for Guest 1-Tap Store Resolution */}
              <div className="space-y-2 pt-2 border-t border-[var(--border)]/70">
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                    <Building className="h-3.5 w-3.5 text-[#0c831f]" />
                    <span>Select Delivery Area (Change Dark Store)</span>
                  </div>
                </div>

                {isLoadingAreas ? (
                  <div className="p-4 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#0c831f]" />
                    <span>Loading delivery areas...</span>
                  </div>
                ) : availableAreas.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {availableAreas.map((ar) => {
                      const isSelected =
                        currentLocation.areaId === ar.id ||
                        currentLocation.area.toLowerCase().includes(ar.name.toLowerCase());

                      return (
                        <button
                          key={ar.id}
                          type="button"
                          onClick={() => handleSelectArea(ar)}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#0c831f] bg-emerald-50/50 dark:bg-emerald-950/20 text-[#0c831f] font-bold shadow-xs ring-1 ring-[#0c831f]/20"
                              : "border-[var(--border)] bg-[var(--surface)] hover:border-[#0c831f]/40 hover:bg-gray-50/60 dark:hover:bg-neutral-800/50 text-[var(--text-primary)]"
                          }`}
                        >
                          <div className={`flex h-6 w-6 items-center justify-center rounded-lg shrink-0 ${
                            isSelected ? "bg-[#0c831f] text-white" : "bg-emerald-50 text-[#0c831f]"
                          }`}>
                            <MapPin className="h-3 w-3" />
                          </div>
                          <span className="text-xs truncate font-medium">{ar.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-2 text-center text-[11px] text-[var(--text-muted)]">
                    Search above to find any society, building, or area.
                  </div>
                )}
              </div>


              {/* SECTION 3: Manage Addresses Direct Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAddNewAddress}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[var(--border)] hover:border-[#0c831f]/40 bg-[var(--surface)] hover:bg-gray-50/60 dark:hover:bg-neutral-800/50 transition-colors text-xs font-bold text-[var(--text-primary)] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-[#0c831f]">
                      <Plus className="h-3.5 w-3.5" />
                    </div>
                    <span>Manage all saved delivery addresses</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer Hub Info */}
        <div className="bg-[var(--surface-secondary)] px-4 sm:px-5 py-2.5 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5 truncate max-w-[260px]">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                currentLocation.isServiceable !== false ? "bg-[#0c831f]" : "bg-amber-500"
              }`}
            />
            <span className="truncate">Fulfilled by: {currentLocation.darkStoreName || "Express Dark Store"}</span>
          </span>
          <span
            className={`font-black shrink-0 ${
              currentLocation.isServiceable !== false ? "text-[#0c831f]" : "text-amber-600"
            }`}
          >
            {currentLocation.isServiceable !== false
              ? `⚡ ${currentLocation.deliveryEtaMinutes || 8} mins delivery`
              : "Unserviceable"}
          </span>
        </div>
      </DialogContent>
    </Dialog>

    {/* Dedicated Add / Edit Doorstep Address Modal */}
    <AddressModal
      isOpen={isAddressModalOpen}
      onClose={() => setIsAddressModalOpen(false)}
      onSave={handleSaveNewAddress}
    />
  </>
  );
}
