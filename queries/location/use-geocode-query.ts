import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../query-keys";
import { DeliveryLocation, GeoCoordinates } from "@/types/location";
import { apiClient } from "@/services/api-client";

export interface ResolvedStoreData {
  storeId?: string;
  storeName?: string;
  storeAddress?: string;
  isServiceable: boolean;
  deliveryEtaMinutes: number;
  distanceKm?: number;
  rawStore?: any;
}

/**
 * Resolves delivery store by GPS coordinates using:
 * POST /api/v1/stores/resolve-delivery
 * Body: { latitude: number, longitude: number }
 */
export async function resolveDeliveryStoreApi(
  coords: GeoCoordinates
): Promise<ResolvedStoreData | null> {
  if (!coords || typeof coords.latitude !== "number" || typeof coords.longitude !== "number") {
    return null;
  }

  try {
    const res = await apiClient.post<any>("/stores/resolve-delivery", {
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    if (!res) return null;

    // Res could be { store: { ... }, isServiceable, estimatedDeliveryMinutes } or directly store object
    const storeObj = res.store || (res.id || res.name || res.store_id || res.store_name ? res : null);
    const storeId = storeObj?.id || storeObj?._id || storeObj?.store_id || storeObj?.storeId;
    const storeName =
      storeObj?.name ||
      storeObj?.store_name ||
      storeObj?.storeName ||
      "Tiding Express Dark Store";
    const storeAddress =
      storeObj?.address ||
      storeObj?.formatted_address ||
      storeObj?.formattedAddress ||
      "";

    const isServiceable =
      res.isServiceable !== undefined
        ? Boolean(res.isServiceable)
        : res.is_serviceable !== undefined
        ? Boolean(res.is_serviceable)
        : res.serviceable !== undefined
        ? Boolean(res.serviceable)
        : Boolean(res.delivery || (res.store && res.store?.status === "ACTIVE"));

    const etaRaw =
      res.delivery?.delivery_time_minutes ??
      res.estimatedDeliveryMinutes ??
      res.deliveryEtaMinutes ??
      res.delivery_eta_minutes ??
      res.settings?.preparation_time_minutes ??
      res.etaMinutes ??
      res.eta;

    const deliveryEtaMinutes =
      typeof etaRaw === "number" && !Number.isNaN(etaRaw)
        ? etaRaw
        : typeof Number(etaRaw) === "number" && !Number.isNaN(Number(etaRaw)) && Number(etaRaw) > 0
        ? Number(etaRaw)
        : isServiceable
        ? 10
        : 0;

    const distanceRaw =
      res.delivery?.distance_km ??
      res.delivery?.distance ??
      res.distanceKm ??
      res.distance_km ??
      res.settings?.delivery_radius_km ??
      res.distance;

    const distanceKm =
      distanceRaw !== undefined && distanceRaw !== null && !Number.isNaN(Number(distanceRaw))
        ? Number(distanceRaw)
        : undefined;

    return {
      storeId: storeId ? String(storeId) : undefined,
      storeName,
      storeAddress,
      isServiceable,
      deliveryEtaMinutes,
      distanceKm: typeof distanceKm === "number" ? distanceKm : undefined,
      rawStore: storeObj,
    };
  } catch (err) {
    console.warn("Resolve delivery store API warning:", err);
    return null;
  }
}

export function useResolveDeliveryStoreQuery(coords?: GeoCoordinates | null) {
  return useQuery<ResolvedStoreData | null>({
    queryKey: coords ? QUERY_KEYS.LOCATION.RESOLVE_DELIVERY(coords.latitude, coords.longitude) : ["location", "resolve-delivery", "disabled"],
    queryFn: async () => {
      if (!coords) return null;
      return resolveDeliveryStoreApi(coords);
    },
    enabled: Boolean(coords && coords.latitude && coords.longitude),
    staleTime: 1000 * 60 * 15, // 15 mins
  });
}

export function useGeocodeQuery(coords?: GeoCoordinates | null) {
  return useQuery<DeliveryLocation | null>({
    queryKey: coords ? QUERY_KEYS.LOCATION.GEOCODE(coords.latitude, coords.longitude) : ["location", "geocode", "disabled"],
    queryFn: async () => {
      if (!coords) return null;

      // 1. Resolve store info from backend
      const storeInfo = await resolveDeliveryStoreApi(coords);

      // Local fallback location
      const fallbackLocation: DeliveryLocation = {
        area: "HSR Layout, Sector 1",
        formattedAddress: "HSR Layout, Sector 1, Bengaluru, Karnataka 560102",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560102",
        coordinates: coords,
        deliveryEtaMinutes: storeInfo?.deliveryEtaMinutes || 8,
        isServiceable: storeInfo ? storeInfo.isServiceable : true,
        darkStoreId: storeInfo?.storeId || "store-hsr-01",
        darkStoreName: storeInfo?.storeName || "HSR Express Dark Store",
        storeAddress: storeInfo?.storeAddress,
        storeDistanceKm: storeInfo?.distanceKm,
      };

      try {
        const res = await apiClient.get<DeliveryLocation>(
          `/geocode/reverse?lat=${coords.latitude}&lng=${coords.longitude}`,
          fallbackLocation
        );

        if (storeInfo && res) {
          res.darkStoreId = storeInfo.storeId || res.darkStoreId;
          res.darkStoreName = storeInfo.storeName || res.darkStoreName;
          res.storeAddress = storeInfo.storeAddress || res.storeAddress;
          res.deliveryEtaMinutes = storeInfo.deliveryEtaMinutes || res.deliveryEtaMinutes;
          res.isServiceable = storeInfo.isServiceable;
          res.storeDistanceKm = storeInfo.distanceKm;
        }

        return res;
      } catch {
        return fallbackLocation;
      }
    },
    enabled: Boolean(coords && coords.latitude && coords.longitude),
    staleTime: 1000 * 60 * 30, // 30 mins
  });
}

export function useServiceAreasQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.LOCATION.DARK_STORES(),
    queryFn: async () => {
      try {
        const res = await apiClient.get<any[]>("/service-areas");
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 60,
  });
}
