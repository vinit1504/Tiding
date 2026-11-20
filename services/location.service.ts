/**
 * @name location.service.ts
 * @description API service for customer location detection, geocoding, and address persistence.
 * Connects directly to backend location endpoints.
 */

import { getStoredAccessToken } from "@/lib/auth/token-storage";
import { API_ENDPOINTS } from "@/lib/constants/api-endpoints";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export interface ReverseGeocodeResponse {
  formattedAddress: string;
  fullAddress: string;
  street: string | null;
  locality: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  source?: string;
  road?: string | null;
  darkStoreId?: string | null;
  darkStoreName?: string | null;
  deliveryEtaMinutes?: number | null;
  isServiceable?: boolean | null;
}

export interface IpLookupResponse {
  latitude: number;
  longitude: number;
  accuracy: number;
  city: string | null;
  region: string | null;
  country: string | null;
  postalCode: string | null;
  locationSource: "ip_location";
  isUserConfirmed: false;
  warning: string;
}

export interface SaveLocationPayload {
  latitude: number;
  longitude: number;
  accuracy?: number;
  locationSource:
    | "browser_gps"
    | "manual_map_selection"
    | "ip_location"
    | "manual_pin"
    | "place_search"
    | "saved_address"
    | "browser_approximate";
  isUserConfirmed: true;
  houseNo?: string;
  street?: string;
  locality?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  landmark?: string;
  fullAddress?: string;
  addressDetails?: Record<string, any>;
}

export interface CustomerLocationRecord {
  id: string;
  customerId: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  locationSource: string;
  isUserConfirmed: boolean;
  address: {
    fullAddress: string | null;
    street: string | null;
    locality: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postalCode: string | null;
    houseNo?: string | null;
    landmark?: string | null;
  };
  houseNo?: string | null;
  landmark?: string | null;
  createdAt: string;
}

export const locationApi = {
  /**
   * 1. Reverse geocodes coordinates to structured address
   * Calls GET /api/v1/locations/reverse-geocode?latitude={lat}&longitude={lng}
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResponse> {
    const endpoint = API_ENDPOINTS.LOCATIONS.REVERSE_GEOCODE(latitude, longitude);
    const res = await fetch(`${API_BASE_URL}${endpoint}&lat=${latitude}&lng=${longitude}`, {
      headers: { Accept: "application/json" },
    });
    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.message || "Reverse geocoding failed");
    }
    const data = json.data !== undefined ? json.data : json;
    return {
      formattedAddress: data.formattedAddress || data.fullAddress || "",
      fullAddress: data.fullAddress || data.formattedAddress || "",
      street: data.street || data.road || null,
      locality: data.locality || data.area || null,
      city: data.city || null,
      state: data.state || null,
      country: data.country || "India",
      postalCode: data.postalCode || data.pincode || null,
      source: data.source || data.locationSource,
      road: data.road || null,
      darkStoreId: data.darkStoreId || null,
      darkStoreName: data.darkStoreName || null,
      deliveryEtaMinutes: data.deliveryEtaMinutes || null,
      isServiceable: data.isServiceable !== undefined ? data.isServiceable : null,
    };
  },

  /**
   * 2. Resolves approximate city and coordinates when GPS is denied
   * Calls GET /api/v1/locations/ip-lookup
   */
  async ipLookup(): Promise<IpLookupResponse> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOCATIONS.IP_LOOKUP}`, {
      headers: { Accept: "application/json" },
    });
    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.message || "IP lookup failed");
    }
    const data = json.data !== undefined ? json.data : json;
    return {
      latitude: Number(data.latitude) || 23.0225,
      longitude: Number(data.longitude) || 72.5714,
      accuracy: Number(data.accuracy) || 2500,
      city: data.city || "Ahmedabad",
      region: data.region || data.state || "Gujarat",
      country: data.country || "India",
      postalCode: data.postalCode || data.pincode || "380015",
      locationSource: "ip_location",
      isUserConfirmed: false,
      warning: data.warning || "Approximate network location",
    };
  },

  /**
   * 3. Confirms and saves delivery location for customer or guest checkout
   * Calls POST /api/v1/locations (isUserConfirmed: true)
   */
  async confirmLocation(
    payload: SaveLocationPayload,
    accessToken?: string | null
  ): Promise<CustomerLocationRecord> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    const token = accessToken || getStoredAccessToken();
    if (token && token !== "token_vinit_default") {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOCATIONS.SAVE}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...payload,
        isUserConfirmed: true, // Strictly enforced by backend
        houseNo: payload.houseNo || payload.addressDetails?.houseNo,
        landmark: payload.landmark || payload.addressDetails?.landmark,
        street: payload.street || payload.addressDetails?.street,
        locality: payload.locality || payload.addressDetails?.locality,
        city: payload.city || payload.addressDetails?.city,
        state: payload.state || payload.addressDetails?.state,
        country: payload.country || payload.addressDetails?.country || "India",
        postalCode: payload.postalCode || payload.addressDetails?.postalCode,
        fullAddress: payload.fullAddress || payload.addressDetails?.fullAddress,
      }),
    });

    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.message || "Failed to confirm delivery location");
    }
    return (json.data !== undefined ? json.data : json) as CustomerLocationRecord;
  },

  /**
   * 4. Lists saved delivery locations for logged-in customer
   * Calls GET /api/v1/locations?page=1&limit=20
   */
  async getSavedLocations(accessToken?: string | null): Promise<CustomerLocationRecord[]> {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    const token = accessToken || getStoredAccessToken();
    if (token && token !== "token_vinit_default") {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOCATIONS.LIST(1, 20)}`, {
      headers,
    });
    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.message || "Failed to fetch saved locations");
    }
    const data = json.data !== undefined ? json.data : json;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.locations)) return data.locations;
    return [];
  },
};
