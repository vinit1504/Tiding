"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { locationService } from "@/lib/api/location-service";
import { QUERY_KEYS } from "@/queries/query-keys";
import {
  CountryItem,
  StateItem,
  CityItem,
  PincodeItem,
  AreaItem,
} from "@/types/location";

/**
 * 1. Fetch Countries List
 * GET /api/v1/location/countries?page=1&limit=50
 */
export function useCountriesQuery() {
  return useQuery<CountryItem[]>({
    queryKey: QUERY_KEYS.LOCATION.COUNTRIES(),
    queryFn: () => locationService.getCountries({ page: 1, limit: 50, is_active: "active" }),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * 2. Fetch States by Country ID
 * GET /api/v1/location/states?country_id=...&page=1&limit=50
 */
export function useStatesQuery(countryId?: string) {
  return useQuery<StateItem[]>({
    queryKey: QUERY_KEYS.LOCATION.STATES(countryId),
    queryFn: () =>
      countryId
        ? locationService.getStates({ country_id: countryId, page: 1, limit: 50, is_active: "active" })
        : Promise.resolve([]),
    enabled: !!countryId,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

/**
 * 3. Fetch Cities by State ID
 * GET /api/v1/location/cities?state_id=...&page=1&limit=50
 */
export function useCitiesQuery(stateId?: string) {
  return useQuery<CityItem[]>({
    queryKey: QUERY_KEYS.LOCATION.CITIES(stateId),
    queryFn: () =>
      stateId
        ? locationService.getCities({ state_id: stateId, page: 1, limit: 50, is_active: "active" })
        : Promise.resolve([]),
    enabled: !!stateId,
    staleTime: 1000 * 60 * 15,
  });
}

/**
 * 4. Fetch Pincodes by City ID
 * GET /api/v1/location/pincodes?city_id=...&page=1&limit=50
 */
export function usePincodesQuery(cityId?: string) {
  return useQuery<PincodeItem[]>({
    queryKey: QUERY_KEYS.LOCATION.PINCODES(cityId),
    queryFn: () =>
      cityId
        ? locationService.getPincodes({ city_id: cityId, page: 1, limit: 100, is_active: "active" })
        : Promise.resolve([]),
    enabled: !!cityId,
    staleTime: 1000 * 60 * 15,
  });
}

/**
 * 5. Fetch Areas by City ID and/or Pincode ID
 * GET /api/v1/location/areas?city_id=...&pincode_id=...&page=1&limit=200
 */
export function useAreasQuery(params?: {
  city_id?: string;
  pincode_id?: string;
  search?: string;
}) {
  return useQuery<AreaItem[]>({
    queryKey: QUERY_KEYS.LOCATION.AREAS(params as Record<string, unknown>),
    queryFn: () =>
      locationService.getAreas({
        city_id: params?.city_id,
        pincode_id: params?.pincode_id,
        search: params?.search,
        page: 1,
        limit: 200,
        is_active: "active",
      }),
    enabled: !!(params?.city_id || params?.pincode_id || params?.search),
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * 6. Resolve Store by Area Mutation
 * POST /api/v1/location/resolve-store
 */
export function useResolveStoreMutation() {
  return useMutation({
    mutationFn: (areaId: string) => locationService.resolveStoreByArea(areaId),
  });
}
