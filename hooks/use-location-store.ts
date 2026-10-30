"use client";

import { useCallback } from "react";
import { useAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import {
  persistentLocationAtom,
  isLocatingStoreAtom,
  hasUserSetLocationAtom,
} from "@/stores";
import { DeliveryLocation, GeoCoordinates } from "@/types/location";
import { resolveDeliveryStoreApi } from "@/queries/location/use-geocode-query";
import { toast } from "sonner";

export interface ServingStore {
  storeId: string;
  storeName: string;
  deliveryTimeMinutes: number;
  deliveryFee: number;
  isServiceable: boolean;
  storeAddress?: string;
  distanceKm?: number;
}

export function useLocationStore() {
  const queryClient = useQueryClient();
  const [currentLocation, setCurrentLocation] = useAtom(persistentLocationAtom);
  const [isLocating, setIsLocating] = useAtom(isLocatingStoreAtom);
  const [, setHasUserSetLocation] = useAtom(hasUserSetLocationAtom);

  const selectedAddress = {
    id: currentLocation.id,
    houseNo: currentLocation.houseNo || "",
    society: currentLocation.society || currentLocation.area || "",
    area: currentLocation.area,
    city: currentLocation.city,
    state: currentLocation.state,
    pincode: currentLocation.pincode,
    formattedAddress: currentLocation.formattedAddress,
    coordinates: currentLocation.coordinates,
  };

  const servingStore: ServingStore = {
    storeId: currentLocation.darkStoreId || "2a6ba8df-637f-4939-bc17-69ad6832c050",
    storeName: currentLocation.darkStoreName || "Express Dark Store",
    deliveryTimeMinutes: currentLocation.deliveryEtaMinutes || 10,
    deliveryFee: 0,
    isServiceable: currentLocation.isServiceable !== false,
    storeAddress: currentLocation.storeAddress,
    distanceKm: currentLocation.storeDistanceKm,
  };

  /**
   * Set delivery address and invalidate product catalog caches so store inventory live-reloads
   */
  const setDeliveryAddress = useCallback(
    (newLocation: DeliveryLocation) => {
      const prevStoreId = currentLocation.darkStoreId;
      setCurrentLocation(newLocation);
      setHasUserSetLocation(true);

      // If dark store changed, invalidate catalog and inventory queries
      if (newLocation.darkStoreId && newLocation.darkStoreId !== prevStoreId) {
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["store-inventory"] });
        queryClient.invalidateQueries({ queryKey: ["catalog"] });
      }
    },
    [currentLocation.darkStoreId, setCurrentLocation, setHasUserSetLocation, queryClient]
  );

  /**
   * Resolve dark store by area ID or GPS coordinates
   */
  const resolveServingStore = useCallback(
    async (params: { areaId?: string; coordinates?: GeoCoordinates }) => {
      setIsLocating(true);
      try {
        let resolvedStore: any = null;

        if (params.areaId) {
          try {
            const { locationService } = await import("@/services/location-service");
            const res = await locationService.resolveStoreByArea(params.areaId);
            if (res) {
              resolvedStore = {
                storeId: res.storeId,
                storeName: res.storeName,
                storeAddress: res.storeAddress,
                deliveryEtaMinutes: res.deliveryEtaMinutes || 10,
                isServiceable: res.isServiceable,
                distanceKm: (res as any).distanceKm,
              };
            }
          } catch (err) {
            console.warn("Resolve store by area error:", err);
          }
        }

        if (!resolvedStore && params.coordinates) {
          resolvedStore = await resolveDeliveryStoreApi(params.coordinates);
        }

        if (resolvedStore) {
          const updatedLocation: DeliveryLocation = {
            ...currentLocation,
            darkStoreId: resolvedStore.storeId || currentLocation.darkStoreId,
            darkStoreName: resolvedStore.storeName || currentLocation.darkStoreName,
            storeAddress: resolvedStore.storeAddress || currentLocation.storeAddress,
            deliveryEtaMinutes: resolvedStore.deliveryEtaMinutes || currentLocation.deliveryEtaMinutes,
            isServiceable: resolvedStore.isServiceable,
            storeDistanceKm: resolvedStore.distanceKm || currentLocation.storeDistanceKm,
          };

          setDeliveryAddress(updatedLocation);
          return updatedLocation;
        }

        return currentLocation;
      } catch (err: any) {
        console.warn("resolveServingStore notice:", err?.message || err);
        toast.error("Failed to resolve nearby store. Using default delivery zone.");
        return currentLocation;
      } finally {
        setIsLocating(false);
      }
    },
    [currentLocation, setDeliveryAddress, setIsLocating]
  );

  return {
    selectedAddress,
    servingStore,
    isLocating,
    setDeliveryAddress,
    resolveServingStore,
    rawLocation: currentLocation,
  };
}
