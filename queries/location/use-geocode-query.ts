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
export type ResolveDeliveryInput =
  | GeoCoordinates
  | { area_id?: string; latitude?: number; longitude?: number; coords?: GeoCoordinates };

/**
 * Resolves delivery store by area_id or GPS coordinates using:
 * POST /api/v1/stores/resolve-delivery
 * Body: { area_id?: string, latitude?: number, longitude?: number }
 */
export async function resolveDeliveryStoreApi(
  input: ResolveDeliveryInput
): Promise<ResolvedStoreData | null> {
  if (!input) return null;

  const areaId = "area_id" in input ? input.area_id : undefined;
  const latitude =
    "latitude" in input && typeof input.latitude === "number"
      ? input.latitude
      : "coords" in input && input.coords?.latitude
      ? input.coords.latitude
      : "latitude" in input
      ? (input as any).latitude
      : undefined;

  const longitude =
    "longitude" in input && typeof input.longitude === "number"
      ? input.longitude
      : "coords" in input && input.coords?.longitude
      ? input.coords.longitude
      : "longitude" in input
      ? (input as any).longitude
      : undefined;

  if (!areaId && (typeof latitude !== "number" || typeof longitude !== "number")) {
    return null;
  }

  try {
    const payload: Record<string, any> = {};
    if (areaId) payload.area_id = areaId;
    if (typeof latitude === "number" && typeof longitude === "number") {
      payload.latitude = latitude;
      payload.longitude = longitude;
    }

    const res = await apiClient.post<any>("/stores/resolve-delivery", payload);
    if (!res) return null;

    // Response structure: { success: true, data: { store: { ... }, delivery: { ... } } }
    const root = res.data || res;
    const storeObj = root.store || (root.id || root.name || root.store_id || root.storeName ? root : null);
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

    const delivery = root.delivery;

    const isServiceable =
      root.isServiceable !== undefined
        ? Boolean(root.isServiceable)
        : root.is_serviceable !== undefined
        ? Boolean(root.is_serviceable)
        : root.serviceable !== undefined
        ? Boolean(root.serviceable)
        : Boolean(delivery || (storeObj && (storeObj.status === "ACTIVE" || !storeObj.status)));

    const etaRaw =
      delivery?.delivery_time_minutes ??
      delivery?.deliveryTimeMinutes ??
      root.estimatedDeliveryMinutes ??
      root.deliveryEtaMinutes ??
      root.delivery_eta_minutes ??
      root.settings?.preparation_time_minutes ??
      root.etaMinutes ??
      root.eta;

    const deliveryEtaMinutes =
      typeof etaRaw === "number" && !Number.isNaN(etaRaw)
        ? etaRaw
        : typeof Number(etaRaw) === "number" && !Number.isNaN(Number(etaRaw)) && Number(etaRaw) > 0
        ? Number(etaRaw)
        : isServiceable
        ? 10
        : 0;

    const distanceRaw =
      delivery?.distance_km ??
      delivery?.distance ??
      root.distanceKm ??
      root.distance_km ??
      root.settings?.delivery_radius_km ??
      root.distance;

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
        darkStoreId: storeInfo?.storeId || "2a6ba8df-637f-4939-bc17-69ad6832c050",
        darkStoreName: storeInfo?.storeName || "Tiding Daily - Bopal",
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
