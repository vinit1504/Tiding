"use client";

import { useState, useCallback } from "react";
import { useAtom } from "jotai";
import { persistentLocationAtom, hasUserSetLocationAtom } from "@/stores";
import { getStoredAccessToken } from "@/lib/auth/token-storage";
import { DeliveryLocation } from "@/types/location";
import { locationService } from "@/lib/api/location-service";
import { toast } from "sonner";

export interface Address {
  fullAddress: string | null;
  street: string | null;
  locality: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
}

export interface LocationState {
  latitude: number;
  longitude: number;
  accuracy: number;
  locationSource: "browser_gps" | "manual_map_selection" | "ip_location" | "browser_approximate";
  isUserConfirmed: boolean;
  address?: Address;
}

export function useLocationDetector() {
  const [, setGlobalLocation] = useAtom(persistentLocationAtom);
  const [, setHasUserSetLocation] = useAtom(hasUserSetLocationAtom);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationState | null>(null);

  // 1. Trigger GPS Detection with automatic IP Fallback
  const detectLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      await fallbackToIpLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        try {
          // Call backend reverse geocode (server keeps Google API key safe)
          const addressData = await locationService.reverseGeocode(latitude, longitude);

          const isHighPrecision = accuracy <= 30;
          const locationSource = isHighPrecision ? "browser_gps" : "browser_approximate";

          setLocation({
            latitude,
            longitude,
            accuracy: Math.round(accuracy),
            locationSource,
            isUserConfirmed: false, // Requires user review before final save
            address: {
              fullAddress: addressData?.fullAddress || null,
              street: addressData?.street || null,
              locality: addressData?.locality || null,
              city: addressData?.city || null,
              state: addressData?.state || null,
              country: addressData?.country || "India",
              postalCode: addressData?.postalCode || null,
            },
          });
        } catch (err) {
          console.warn("[LocationDetector] Reverse geocode notice, falling back to IP:", err);
          await fallbackToIpLocation();
        } finally {
          setLoading(false);
        }
      },
      async (geoError) => {
        console.warn("GPS failed, using IP fallback:", geoError.message);
        await fallbackToIpLocation();
      },
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 0 }
    );
  }, []);

  // 2. IP Fallback if GPS is blocked or unavailable
  const fallbackToIpLocation = useCallback(async () => {
    setLoading(true);
    try {
      const data = await locationService.ipLookup();
      if (!data) {
        throw new Error("Unable to resolve IP location");
      }

      setLocation({
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy || 2500,
        locationSource: "ip_location",
        isUserConfirmed: false,
        address: {
          fullAddress: `${data.city}, ${data.region}`,
          city: data.city,
          state: data.region,
          country: data.country || "India",
          postalCode: data.postalCode || null,
          street: null,
          locality: null,
        },
      });
    } catch (err: any) {
      setError("Unable to resolve location. Please select manually on map.");
      toast.info("Could not resolve IP location. Please select your location on the map.");
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Confirm and Save Delivery Location
  const confirmAndSaveLocation = useCallback(
    async (token?: string, overrides?: Partial<Address> & { houseNo?: string; landmark?: string }) => {
      if (!location) return null;

      setLoading(true);
      setError(null);
      try {
        const effectiveSource =
          location.locationSource === "ip_location"
            ? "manual_map_selection"
            : location.locationSource;

        const payload = {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          locationSource: effectiveSource,
          isUserConfirmed: true, // Backend enforces true
          ...location.address,
          ...overrides,
        };

        const res = await locationService.saveLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          locationSource: effectiveSource,
          isUserConfirmed: true,
          addressDetails: {
            fullAddress: (overrides?.fullAddress ?? location.address?.fullAddress) || undefined,
            street: (overrides?.street ?? location.address?.street) || undefined,
            locality: (overrides?.locality ?? location.address?.locality) || undefined,
            city: (overrides?.city ?? location.address?.city) || undefined,
            state: (overrides?.state ?? location.address?.state) || undefined,
            country: (overrides?.country ?? location.address?.country) || "India",
            postalCode: (overrides?.postalCode ?? location.address?.postalCode) || undefined,
            houseNo: overrides?.houseNo || undefined,
            landmark: overrides?.landmark || undefined,
          },
        });

        const savedData = res.data || payload;

        // Sync with global Jotai store and localStorage
        const deliveryLoc: DeliveryLocation = {
          id: savedData.id || `loc-${Date.now()}`,
          coordinates: { latitude: location.latitude, longitude: location.longitude },
          accuracy: location.accuracy,
          locationSource: effectiveSource,
          formattedAddress:
            overrides?.fullAddress ||
            location.address?.fullAddress ||
            `${location.address?.city || "Confirmed Location"}, ${location.address?.state || ""}`,
          street: overrides?.street || location.address?.street || undefined,
          area: overrides?.locality || location.address?.locality || location.address?.city || "Area",
          city: overrides?.city || location.address?.city || "",
          state: overrides?.state || location.address?.state || "",
          country: overrides?.country || location.address?.country || "India",
          pincode: overrides?.postalCode || location.address?.postalCode || "",
          deliveryEtaMinutes: 10,
          isServiceable: true,
        };

        setGlobalLocation(deliveryLoc);
        setHasUserSetLocation(true);

        setLocation({
          ...location,
          isUserConfirmed: true,
          locationSource: effectiveSource,
        });

        toast.success("Delivery location confirmed successfully!");
        return savedData;
      } catch (err: any) {
        const msg = err.message || "Failed to save delivery location.";
        setError(msg);
        toast.error(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [location, setGlobalLocation, setHasUserSetLocation]
  );

  return {
    location,
    loading,
    error,
    detectLocation,
    fallbackToIpLocation,
    confirmAndSaveLocation,
    setLocation,
  };
}
