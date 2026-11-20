"use client";

import { useState, useCallback } from "react";
import {
  BrowserGeolocationResult,
  LocationSource,
  getAccuracyInfo,
  AccuracyInfo,
} from "@/types/location";
import { toast } from "sonner";

export interface GeolocationError {
  code: "NOT_SUPPORTED" | "PERMISSION_DENIED" | "POSITION_UNAVAILABLE" | "TIMEOUT" | "UNKNOWN";
  message: string;
  originalError?: GeolocationPositionError;
}

export interface UseCustomerGeolocationReturn {
  isDetecting: boolean;
  detectedLocation: BrowserGeolocationResult | null;
  accuracyInfo: AccuracyInfo | null;
  error: GeolocationError | null;
  detectLocation: (options?: {
    onSuccess?: (result: BrowserGeolocationResult) => void;
    onError?: (err: GeolocationError) => void;
  }) => Promise<BrowserGeolocationResult | null>;
  reset: () => void;
}

export function useCustomerGeolocation(): UseCustomerGeolocationReturn {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<BrowserGeolocationResult | null>(null);
  const [accuracyInfo, setAccuracyInfo] = useState<AccuracyInfo | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);

  const reset = useCallback(() => {
    setIsDetecting(false);
    setDetectedLocation(null);
    setAccuracyInfo(null);
    setError(null);
  }, []);

  const detectLocation = useCallback(
    async (callbacks?: {
      onSuccess?: (result: BrowserGeolocationResult) => void;
      onError?: (err: GeolocationError) => void;
    }): Promise<BrowserGeolocationResult | null> => {
      // 1. Check browser support
      if (typeof window === "undefined" || !navigator.geolocation) {
        const errObj: GeolocationError = {
          code: "NOT_SUPPORTED",
          message:
            "Geolocation is not supported by your browser. Please search your address or pick on the map.",
        };
        setError(errObj);
        toast.error(errObj.message);
        callbacks?.onError?.(errObj);
        return null;
      }

      setIsDetecting(true);
      setError(null);

      return new Promise<BrowserGeolocationResult | null>((resolve) => {
        // Enforce required options: enableHighAccuracy: true, timeout: 20000, maximumAge: 0
        const options: PositionOptions = {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
            const timestamp = position.timestamp || Date.now();

            /**
             * Accuracy verification:
             * Do not claim that GPS is available when the browser only provides an approximate location.
             * Real hardware GPS typically achieves <= 30m accuracy.
             * Greater values (>30m, often 100-2000m) represent Wi-Fi SSID / cellular tower triangulation.
             */
            const isGenuineGps =
              accuracy <= 30 || (altitude !== null && altitude !== undefined);
            const locationSource: LocationSource = isGenuineGps
              ? "browser_gps"
              : "browser_approximate";

            const result: BrowserGeolocationResult = {
              latitude,
              longitude,
              accuracy: Math.round(accuracy),
              altitude: altitude ?? null,
              heading: heading ?? null,
              speed: speed ?? null,
              timestamp,
              locationSource,
            };

            const accInfo = getAccuracyInfo(result.accuracy);

            setIsDetecting(false);
            setDetectedLocation(result);
            setAccuracyInfo(accInfo);
            setError(null);

            callbacks?.onSuccess?.(result);
            resolve(result);
          },
          (geoError: GeolocationPositionError) => {
            setIsDetecting(false);

            let code: GeolocationError["code"] = "UNKNOWN";
            let friendlyMessage = "Unable to retrieve your location. Please select on the map.";

            switch (geoError.code) {
              case geoError.PERMISSION_DENIED:
                code = "PERMISSION_DENIED";
                friendlyMessage =
                  "Location permission was denied. Please allow location access in your browser or select on the map.";
                break;
              case geoError.POSITION_UNAVAILABLE:
                code = "POSITION_UNAVAILABLE";
                friendlyMessage =
                  "Location information is currently unavailable. Please check your GPS/network settings or pick on the map.";
                break;
              case geoError.TIMEOUT:
                code = "TIMEOUT";
                friendlyMessage =
                  "Location detection request timed out after 20 seconds. Please try again or select your location on the map.";
                break;
              default:
                code = "UNKNOWN";
                friendlyMessage =
                  geoError.message || "An unexpected error occurred while detecting location.";
                break;
            }

            const errObj: GeolocationError = {
              code,
              message: friendlyMessage,
              originalError: geoError,
            };

            setError(errObj);
            toast.error(friendlyMessage);
            callbacks?.onError?.(errObj);
            resolve(null);
          },
          options
        );
      });
    },
    []
  );

  return {
    isDetecting,
    detectedLocation,
    accuracyInfo,
    error,
    detectLocation,
    reset,
  };
}
