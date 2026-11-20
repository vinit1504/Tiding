"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  locationApi,
  ReverseGeocodeResponse,
  CustomerLocationRecord,
  SaveLocationPayload,
} from "../services/location.service";
import { useAtom } from "jotai";
import { persistentLocationAtom, hasUserSetLocationAtom } from "@/stores";
import { useQueryClient } from "@tanstack/react-query";
import { DeliveryLocation } from "@/types/location";

const STORAGE_KEY = "tiding_customer_location";

export interface ActiveLocationState {
  latitude: number;
  longitude: number;
  accuracy?: number;
  locationSource: SaveLocationPayload["locationSource"];
  isConfirmed: boolean;
  address: Partial<ReverseGeocodeResponse> & {
    houseNo?: string;
    landmark?: string;
  };
}

export function useCustomerLocation(accessToken?: string | null) {
  const [activeLocation, setActiveLocation] = useState<ActiveLocationState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [gpsPermissionState, setGpsPermissionState] = useState<"prompt" | "granted" | "denied">("prompt");

  // Sync with global store and query client for live inventory invalidation
  const [, setGlobalLocation] = useAtom(persistentLocationAtom);
  const [, setHasUserSetLocation] = useAtom(hasUserSetLocationAtom);

  let queryClient: ReturnType<typeof useQueryClient> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    queryClient = useQueryClient();
  } catch {
    // Safe when mounted outside QueryClientProvider
  }

  const initialDetectionRan = useRef(false);

  /**
   * IP Geolocation fallback when GPS is denied, timed out, or unavailable
   */
  const fallbackToIp = useCallback(async (reason: string) => {
    try {
      const ipData = await locationApi.ipLookup();
      const newLocation: ActiveLocationState = {
        latitude: ipData.latitude,
        longitude: ipData.longitude,
        accuracy: ipData.accuracy,
        locationSource: "ip_location",
        isConfirmed: false,
        address: {
          city: ipData.city || undefined,
          state: ipData.region || undefined,
          country: ipData.country || "India",
          postalCode: ipData.postalCode || undefined,
          fullAddress: `${ipData.city || "Ahmedabad"}, ${ipData.region || "Gujarat"}, India`,
        },
      };
      setActiveLocation(newLocation);
      setError(`Notice: Approximate location loaded via IP (${reason}). Please confirm your exact address.`);
    } catch {
      setError("Unable to resolve location. Please select your address manually.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Detects location: Attempts GPS first; falls back to IP lookup if denied or timed out
   */
  const detectLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      await fallbackToIp("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          setGpsPermissionState("granted");
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = pos.coords.accuracy;

          // Reverse geocode high-precision coordinates
          const address = await locationApi.reverseGeocode(lat, lng);

          const newLocation: ActiveLocationState = {
            latitude: lat,
            longitude: lng,
            accuracy,
            locationSource: "browser_gps",
            isConfirmed: false, // Requires user confirmation of House/Flat & Landmark
            address,
          };

          setActiveLocation(newLocation);
          setError(null);
        } catch (err: any) {
          setError(err?.message || "Reverse geocode failed");
          await fallbackToIp("Reverse geocode failed");
        } finally {
          setIsLoading(false);
        }
      },
      async (geoError) => {
        setGpsPermissionState("denied");
        let reason = "Location permission denied";
        if (geoError.code === geoError.TIMEOUT) reason = "GPS timeout";
        await fallbackToIp(reason);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  }, [fallbackToIp]);

  // Load persisted location from localStorage on first render
  useEffect(() => {
    if (initialDetectionRan.current) return;
    initialDetectionRan.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: ActiveLocationState = JSON.parse(stored);
        setActiveLocation(parsed);
        setIsLoading(false);
        return;
      }
    } catch {
      // ignore JSON parse error
    }

    // If no saved location, automatically detect via GPS or IP
    detectLocation();
  }, [detectLocation]);

  /**
   * Confirms delivery location and persists it to backend & localStorage
   */
  const confirmAndSaveLocation = async (details: {
    houseNo?: string;
    landmark?: string;
    street?: string;
    tag?: "Home" | "Work" | "Other";
  }): Promise<CustomerLocationRecord> => {
    if (!activeLocation) {
      throw new Error("No active location detected to confirm.");
    }

    const payload: SaveLocationPayload = {
      latitude: activeLocation.latitude,
      longitude: activeLocation.longitude,
      accuracy: activeLocation.accuracy || 25,
      locationSource: activeLocation.locationSource,
      isUserConfirmed: true, // Strictly enforced by backend
      houseNo: details.houseNo || activeLocation.address.houseNo,
      landmark: details.landmark || activeLocation.address.landmark,
      street: details.street || activeLocation.address.street || undefined,
      locality: activeLocation.address.locality || undefined,
      city: activeLocation.address.city || undefined,
      state: activeLocation.address.state || undefined,
      country: activeLocation.address.country || "India",
      postalCode: activeLocation.address.postalCode || undefined,
      fullAddress: activeLocation.address.fullAddress || undefined,
      addressDetails: details.tag ? { tag: details.tag } : undefined,
    };

    const savedRecord = await locationApi.confirmLocation(payload, accessToken);

    const updatedState: ActiveLocationState = {
      ...activeLocation,
      isConfirmed: true,
      address: {
        ...activeLocation.address,
        houseNo: details.houseNo || activeLocation.address.houseNo,
        landmark: details.landmark || activeLocation.address.landmark,
        street: details.street || activeLocation.address.street,
      },
    };

    setActiveLocation(updatedState);

    // 1. Persist to localStorage key specified in guide
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
    } catch {}

    // 2. Synchronize with global DeliveryLocation atom & application headers
    const deliveryLoc: DeliveryLocation = {
      id: savedRecord?.id || `loc-${Date.now()}`,
      coordinates: { latitude: activeLocation.latitude, longitude: activeLocation.longitude },
      accuracy: activeLocation.accuracy,
      locationSource: activeLocation.locationSource,
      formattedAddress:
        activeLocation.address.fullAddress ||
        `${details.houseNo ? details.houseNo + ", " : ""}${activeLocation.address.locality || activeLocation.address.city || "Delivery Address"}`,
      houseNo: details.houseNo || activeLocation.address.houseNo || "",
      landmark: details.landmark || activeLocation.address.landmark || "",
      street: details.street || activeLocation.address.street || undefined,
      area: activeLocation.address.locality || activeLocation.address.city || "My Area",
      city: activeLocation.address.city || "",
      state: activeLocation.address.state || "",
      country: activeLocation.address.country || "India",
      pincode: activeLocation.address.postalCode || "",
      deliveryEtaMinutes: activeLocation.address.deliveryEtaMinutes || 10,
      isServiceable: activeLocation.address.isServiceable !== false,
      darkStoreId: activeLocation.address.darkStoreId || undefined,
      darkStoreName: activeLocation.address.darkStoreName || undefined,
    };

    setGlobalLocation(deliveryLoc);
    setHasUserSetLocation(true);

    // 3. Trigger store inventory resolution and refresh product catalog
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["store-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    }

    return savedRecord;
  };

  return {
    activeLocation,
    isLoading,
    error,
    gpsPermissionState,
    detectLocation,
    confirmAndSaveLocation,
  };
}
