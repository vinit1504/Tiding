"use client";

import React, { useState, useEffect, useCallback } from "react";
import { GoogleMapPicker } from "./google-map-picker";
import { GeoCoordinates, LocationSource } from "@/types/location";
import { locationService } from "@/lib/api/location-service";
import { useCustomerGeolocation } from "@/hooks/use-customer-geolocation";

export interface MapLocationResult {
  coordinates: { latitude: number; longitude: number };
  formattedAddress: string;
  society?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  street?: string;
  road?: string;
  locality?: string;
  country?: string;
  accuracy?: number;
  locationSource?: LocationSource;
  darkStoreName?: string;
  deliveryEtaMinutes?: number;
}

interface InteractiveMapProps {
  initialCoordinates?: { latitude: number; longitude: number };
  accuracyMeters?: number;
  locationSource?: LocationSource;
  onLocationSelect?: (result: MapLocationResult) => void;
  className?: string;
}

export default function InteractiveMap({
  initialCoordinates = { latitude: 21.1702, longitude: 72.8311 },
  accuracyMeters,
  locationSource = "manual_pin",
  onLocationSelect,
  className = "w-full h-full",
}: InteractiveMapProps) {
  const [coords, setCoords] = useState<GeoCoordinates>(initialCoordinates);
  const [currentAccuracy, setCurrentAccuracy] = useState<number | undefined>(accuracyMeters);
  const [currentSource, setCurrentSource] = useState<LocationSource>(locationSource);

  const { isDetecting, detectLocation } = useCustomerGeolocation();

  // Reverse-geocode coordinates
  const handleReverseGeocode = useCallback(
    async (lat: number, lng: number, source: LocationSource = "manual_pin", accuracy?: number) => {
      try {
        const res = await locationService.reverseGeocode(lat, lng);
        if (res && onLocationSelect) {
          onLocationSelect({
            coordinates: { latitude: lat, longitude: lng },
            formattedAddress: res.fullAddress || "",
            society: res.society || res.area || "",
            area: res.area || res.locality || "",
            city: res.city || "",
            state: res.state || "",
            pincode: res.postalCode || "",
            street: res.street || "",
            road: res.road || "",
            locality: res.locality || "",
            country: res.country || "India",
            accuracy: accuracy ?? currentAccuracy,
            locationSource: source,
            darkStoreName: res.darkStoreName,
            deliveryEtaMinutes: res.deliveryEtaMinutes,
          });
        }
      } catch (err) {
        console.warn("Reverse geocode failed:", err);
      }
    },
    [onLocationSelect, currentAccuracy]
  );

  // Sync with initialCoordinates
  useEffect(() => {
    if (
      initialCoordinates &&
      (initialCoordinates.latitude !== coords.latitude ||
        initialCoordinates.longitude !== coords.longitude)
    ) {
      setCoords(initialCoordinates);
      handleReverseGeocode(initialCoordinates.latitude, initialCoordinates.longitude, locationSource);
    }
  }, [initialCoordinates.latitude, initialCoordinates.longitude]);

  const handleCoordinatesChange = (newCoords: GeoCoordinates, source: LocationSource) => {
    setCoords(newCoords);
    setCurrentSource(source);
    handleReverseGeocode(newCoords.latitude, newCoords.longitude, source);
  };

  const handleDetect = () => {
    detectLocation({
      onSuccess: (result) => {
        const newCoords = { latitude: result.latitude, longitude: result.longitude };
        setCoords(newCoords);
        setCurrentAccuracy(result.accuracy);
        setCurrentSource(result.locationSource);
        handleReverseGeocode(result.latitude, result.longitude, result.locationSource, result.accuracy);
      },
    });
  };

  return (
    <div className={className}>
      <GoogleMapPicker
        coordinates={coords}
        accuracyMeters={currentAccuracy}
        locationSource={currentSource}
        onCoordinatesChange={handleCoordinatesChange}
        onDetectLocation={handleDetect}
        isDetectingGPS={isDetecting}
        className="w-full h-full min-h-[320px]"
        enableSearch={true}
      />
    </div>
  );
}
