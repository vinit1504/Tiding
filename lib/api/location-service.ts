import { SITE_CONFIG } from "@/lib/constants/site-config";
import { API_ENDPOINTS } from "@/lib/constants/api-endpoints";
import {
  CountryItem,
  StateItem,
  CityItem,
  PincodeItem,
  AreaItem,
} from "@/types/location";
import { isUuid } from "./catalog-service";

export type { CountryItem, StateItem, CityItem, PincodeItem, AreaItem };

export interface StoreResolutionResult {
  storeId?: string;
  storeName?: string;
  storeAddress?: string;
  isServiceable: boolean;
  deliveryEtaMinutes: number;
  distanceKm?: number;
  raw?: any;
}

class LocationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = SITE_CONFIG.apiUrl;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (typeof window !== "undefined") {
      try {
        const token = localStorage.getItem("tiding_token");
        if (token && token !== "token_vinit_default") {
          headers["Authorization"] = `Bearer ${token}`;
        }
      } catch {}
    }
    return headers;
  }

  /**
   * 1. GET /api/v1/location/countries
   * List countries with pagination & active filter
   */
  async getCountries(params?: {
    page?: number;
    limit?: number;
    search?: string;
    is_active?: string | boolean;
  }): Promise<CountryItem[]> {
    try {
      const sp = new URLSearchParams();
      sp.set("page", String(params?.page || 1));
      sp.set("limit", String(params?.limit || 50));
      if (params?.search) sp.set("search", params.search.trim());
      if (params?.is_active !== undefined) sp.set("is_active", String(params.is_active));

      const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.LOCATION.COUNTRIES}?${sp.toString()}`);
      if (!res.ok) return [];
      const json = await res.json().catch(() => null);

      if (json?.data) {
        if (Array.isArray(json.data)) return json.data;
        if (Array.isArray(json.data.countries)) return json.data.countries;
      }
      return [];
    } catch (err) {
      console.warn("getCountries error:", err);
      return [];
    }
  }

  /**
   * 2. GET /api/v1/location/states
   * List states linked to country
   */
  async getStates(params?: {
    country_id?: string;
    page?: number;
    limit?: number;
    search?: string;
    is_active?: string | boolean;
  }): Promise<StateItem[]> {
    try {
      const sp = new URLSearchParams();
      if (params?.country_id) sp.set("country_id", params.country_id);
      sp.set("page", String(params?.page || 1));
      sp.set("limit", String(params?.limit || 50));
      if (params?.search) sp.set("search", params.search.trim());
      if (params?.is_active !== undefined) sp.set("is_active", String(params.is_active));

      const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.LOCATION.STATES}?${sp.toString()}`);
      if (!res.ok) return [];
      const json = await res.json().catch(() => null);

      if (json?.data) {
        if (Array.isArray(json.data)) return json.data;
        if (Array.isArray(json.data.states)) return json.data.states;
      }
      return [];
    } catch (err) {
      console.warn("getStates error:", err);
      return [];
    }
  }

  /**
   * 3. GET /api/v1/location/cities
   * List cities linked to state
   */
  async getCities(params?: {
    state_id?: string;
    page?: number;
    limit?: number;
    search?: string;
    is_active?: string | boolean;
  }): Promise<CityItem[]> {
    try {
      const sp = new URLSearchParams();
      if (params?.state_id) sp.set("state_id", params.state_id);
      sp.set("page", String(params?.page || 1));
      sp.set("limit", String(params?.limit || 50));
      if (params?.search) sp.set("search", params.search.trim());
      if (params?.is_active !== undefined) sp.set("is_active", String(params.is_active));

      const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.LOCATION.CITIES}?${sp.toString()}`);
      if (!res.ok) return [];
      const json = await res.json().catch(() => null);

      if (json?.data) {
        if (Array.isArray(json.data)) return json.data;
        if (Array.isArray(json.data.cities)) return json.data.cities;
      }
      return [];
    } catch (err) {
      console.warn("getCities error:", err);
      return [];
    }
  }

  /**
   * 4. GET /api/v1/location/pincodes
   * List pincodes linked to city
   */
  async getPincodes(params?: {
    city_id?: string;
    page?: number;
    limit?: number;
    search?: string;
    is_active?: string | boolean;
  }): Promise<PincodeItem[]> {
    try {
      const sp = new URLSearchParams();
      if (params?.city_id) sp.set("city_id", params.city_id);
      sp.set("page", String(params?.page || 1));
      sp.set("limit", String(params?.limit || 50));
      if (params?.search) sp.set("search", params.search.trim());
      if (params?.is_active !== undefined) sp.set("is_active", String(params.is_active));

      const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.LOCATION.PINCODES}?${sp.toString()}`);
      if (!res.ok) return [];
      const json = await res.json().catch(() => null);

      if (json?.data) {
        if (Array.isArray(json.data)) return json.data;
        if (Array.isArray(json.data.pincodes)) return json.data.pincodes;
      }
      return [];
    } catch (err) {
      console.warn("getPincodes error:", err);
      return [];
    }
  }

  /**
   * 5. GET /api/v1/location/areas
   * List areas linked to city and/or pincode
   */
  async getAreas(params?: {
    city_id?: string;
    pincode_id?: string;
    page?: number;
    limit?: number;
    search?: string;
    is_active?: string | boolean;
  }): Promise<AreaItem[]> {
    try {
      const sp = new URLSearchParams();
      if (params?.city_id) sp.set("city_id", params.city_id);
      if (params?.pincode_id) sp.set("pincode_id", params.pincode_id);
      sp.set("page", String(params?.page || 1));
      sp.set("limit", String(params?.limit || 50));
      if (params?.search) sp.set("search", params.search.trim());
      if (params?.is_active !== undefined) sp.set("is_active", String(params.is_active));

      const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.LOCATION.AREAS}?${sp.toString()}`);
      if (!res.ok) return [];
      const json = await res.json().catch(() => null);

      if (json?.data) {
        if (Array.isArray(json.data)) return json.data;
        if (Array.isArray(json.data.areas)) return json.data.areas;
      }
      return [];
    } catch (err) {
      console.warn("getAreas error:", err);
      return [];
    }
  }

  /**
   * 6. GET /api/v1/location/areas/slug/:slug
   */
  async getAreaBySlug(slug: string): Promise<AreaItem | null> {
    try {
      const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.LOCATION.AREA_BY_SLUG(slug)}`);
      if (!res.ok) return null;
      const json = await res.json().catch(() => null);
      return json?.data || json || null;
    } catch (err) {
      console.warn("getAreaBySlug error:", err);
      return null;
    }
  }

  /**
   * 7. GET /api/v1/location/areas/:id
   */
  async getAreaById(areaId: string): Promise<AreaItem | null> {
    try {
      const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.LOCATION.AREA(areaId)}`);
      if (!res.ok) return null;
      const json = await res.json().catch(() => null);
      return json?.data || json || null;
    } catch (err) {
      console.warn("getAreaById error:", err);
      return null;
    }
  }

  /**
   * 8. POST /api/v1/location/resolve-store
   * Resolve Store by Area ID using bearer authentication
   */
  async resolveStoreByArea(areaId: string): Promise<StoreResolutionResult | null> {
    try {
      const headers = this.getAuthHeaders();

      // Primary: POST /api/v1/location/resolve-store
      let res = await fetch(`${this.baseUrl}${API_ENDPOINTS.LOCATION.RESOLVE_STORE}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ area_id: areaId }),
      });

      // Fallback: POST /api/v1/stores/resolve-delivery if primary returns 404
      if (!res.ok && res.status === 404) {
        res = await fetch(`${this.baseUrl}/stores/resolve-delivery`, {
          method: "POST",
          headers,
          body: JSON.stringify({ area_id: areaId }),
        });
      }

      if (!res.ok) return null;
      const json = await res.json().catch(() => null);
      if (!json) return null;

      const data = json.data || json;
      const storeObj = data.store || (data.id || data.store_id || data.name ? data : null);
      const isServiceable =
        data.is_serviceable ??
        data.isServiceable ??
        data.serviceable ??
        (!!storeObj && storeObj.status !== "INACTIVE");

      const deliveryEtaMinutes = Number(
        data.delivery?.delivery_time_minutes ||
        data.deliveryEtaMinutes ||
        data.delivery_eta_minutes ||
        (isServiceable ? 10 : 0)
      );

      return {
        storeId: storeObj?.id || storeObj?.store_id || storeObj?._id,
        storeName: storeObj?.name || storeObj?.store_name || "Tiding Express Store",
        storeAddress: storeObj?.address || storeObj?.formatted_address || "",
        isServiceable: Boolean(isServiceable),
        deliveryEtaMinutes: deliveryEtaMinutes > 0 ? deliveryEtaMinutes : 10,
        distanceKm: data.distanceKm || data.distance_km,
        raw: data,
      };
    } catch (err) {
      console.warn("Resolve store by area error:", err);
      return null;
    }
  }

  /**
   * Helper to resolve valid UUIDs for area, city, state, country hierarchy.
   * Prevents NestJS @IsUUID validation failures when custom text is entered or ids are missing.
   */
  async resolveHierarchyUuids(params: {
    areaId?: string | null;
    cityId?: string | null;
    stateId?: string | null;
    countryId?: string | null;
    pincodeId?: string | null;
    areaName?: string | null;
    cityName?: string | null;
    stateName?: string | null;
    pincode?: string | null;
  }): Promise<{
    areaId: string | null;
    cityId: string | null;
    stateId: string | null;
    countryId: string | null;
    pincodeId: string | null;
  }> {
    let resolvedAreaId = isUuid(params.areaId) ? params.areaId! : null;
    let resolvedCityId = isUuid(params.cityId) ? params.cityId! : null;
    let resolvedStateId = isUuid(params.stateId) ? params.stateId! : null;
    let resolvedCountryId = isUuid(params.countryId) ? params.countryId! : null;
    let resolvedPincodeId = isUuid(params.pincodeId) ? params.pincodeId! : null;

    try {
      // 1. Resolve Area if needed
      let matchedArea: AreaItem | null = null;
      if (!resolvedAreaId) {
        if (params.areaName?.trim()) {
          const areas = await this.getAreas({ search: params.areaName.trim(), limit: 5 });
          if (areas && areas.length > 0) {
            const exact = areas.find(
              (a) => a.name.toLowerCase() === params.areaName!.trim().toLowerCase()
            );
            matchedArea = exact || areas[0];
            if (isUuid(matchedArea.id)) {
              resolvedAreaId = matchedArea.id;
            }
          }
        }
        // If still no area, fetch first available system area
        if (!resolvedAreaId) {
          const fallbackAreas = await this.getAreas({ limit: 1 });
          if (fallbackAreas && fallbackAreas.length > 0 && isUuid(fallbackAreas[0].id)) {
            matchedArea = fallbackAreas[0];
            resolvedAreaId = fallbackAreas[0].id;
          }
        }
      }

      // 2. Resolve City if needed
      let matchedCity: CityItem | null = null;
      if (!resolvedCityId) {
        if (matchedArea?.city_id && isUuid(matchedArea.city_id)) {
          resolvedCityId = matchedArea.city_id;
        } else {
          const searchCity = params.cityName?.trim() || "Surat";
          const cities = await this.getCities({ search: searchCity, limit: 1 });
          if (cities && cities.length > 0 && isUuid(cities[0].id)) {
            matchedCity = cities[0];
            resolvedCityId = cities[0].id;
          } else {
            const fallbackCities = await this.getCities({ limit: 1 });
            if (fallbackCities && fallbackCities.length > 0 && isUuid(fallbackCities[0].id)) {
              matchedCity = fallbackCities[0];
              resolvedCityId = fallbackCities[0].id;
            }
          }
        }
      }

      // 3. Resolve State if needed
      let matchedState: StateItem | null = null;
      if (!resolvedStateId) {
        if (matchedCity?.state_id && isUuid(matchedCity.state_id)) {
          resolvedStateId = matchedCity.state_id;
        } else {
          const searchState = params.stateName?.trim() || "Gujarat";
          const states = await this.getStates({ search: searchState, limit: 1 });
          if (states && states.length > 0 && isUuid(states[0].id)) {
            matchedState = states[0];
            resolvedStateId = states[0].id;
          } else {
            const fallbackStates = await this.getStates({ limit: 1 });
            if (fallbackStates && fallbackStates.length > 0 && isUuid(fallbackStates[0].id)) {
              matchedState = fallbackStates[0];
              resolvedStateId = fallbackStates[0].id;
            }
          }
        }
      }

      // 4. Resolve Country if needed
      if (!resolvedCountryId) {
        if (matchedState?.country_id && isUuid(matchedState.country_id)) {
          resolvedCountryId = matchedState.country_id;
        } else {
          const countries = await this.getCountries({ limit: 1 });
          if (countries && countries.length > 0 && isUuid(countries[0].id)) {
            resolvedCountryId = countries[0].id;
          }
        }
      }
    } catch (e) {
      console.warn("resolveHierarchyUuids error:", e);
    }

    return {
      areaId: resolvedAreaId,
      cityId: resolvedCityId,
      stateId: resolvedStateId,
      countryId: resolvedCountryId,
      pincodeId: resolvedPincodeId,
    };
  }
}

export const locationService = new LocationService();
