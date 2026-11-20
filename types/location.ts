export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export type LocationSource =
  | "browser_gps"
  | "browser_approximate"
  | "manual_pin"
  | "manual_map_selection"
  | "ip_location"
  | "place_search"
  | "saved_address";

export interface BrowserGeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
  locationSource: LocationSource;
}

export type AccuracyLevel = "high" | "moderate" | "approximate" | "low";

export interface AccuracyInfo {
  level: AccuracyLevel;
  accuracyMeters: number;
  label: string;
  description: string;
  color: string;
  badgeClass: string;
  recommendation: string;
  requiresManualReview: boolean;
}

/**
 * Accuracy management thresholds based on user specification:
 * - 0–30 meters: Good accuracy.
 * - 30–100 meters: Accept with a confirmation option.
 * - 100–500 meters: Show a warning and recommend map adjustment.
 * - Above 500 meters: Ask the customer to select the correct location manually.
 */
export function getAccuracyInfo(accuracyMeters?: number | null): AccuracyInfo {
  const meters =
    typeof accuracyMeters === "number" && !Number.isNaN(accuracyMeters)
      ? Math.max(0, Math.round(accuracyMeters))
      : 999;

  if (meters <= 30) {
    return {
      level: "high",
      accuracyMeters: meters,
      label: "Good Accuracy",
      description: `Precise device location within ±${meters}m`,
      color: "#16a34a",
      badgeClass:
        "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
      recommendation: "Your location looks accurate. You can confirm delivery directly.",
      requiresManualReview: false,
    };
  }

  if (meters <= 100) {
    return {
      level: "moderate",
      accuracyMeters: meters,
      label: "Moderate Accuracy",
      description: `Detected within ±${meters}m range`,
      color: "#0284c7",
      badgeClass:
        "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
      recommendation:
        "Acceptable accuracy. Please quickly check the map pin before confirming.",
      requiresManualReview: false,
    };
  }

  if (meters <= 500) {
    return {
      level: "approximate",
      accuracyMeters: meters,
      label: "Approximate Location",
      description: `Approximate area within ±${meters}m`,
      color: "#d97706",
      badgeClass:
        "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
      recommendation:
        "We recommend dragging the map marker to your exact building or society entrance.",
      requiresManualReview: true,
    };
  }

  return {
    level: "low",
    accuracyMeters: meters,
    label: "Low Accuracy / Manual Selection Required",
    description: `Broad estimate (±${meters}m). Hardware GPS not available.`,
    color: "#dc2626",
    badgeClass:
      "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
    recommendation:
      "Please search for your street or move the marker manually to your precise doorstep.",
    requiresManualReview: true,
  };
}

export interface ReverseGeocodeResult {
  fullAddress: string;
  street: string;
  road: string;
  area: string;
  locality: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  society?: string;
  houseNo?: string;
  landmark?: string;
  coordinates: GeoCoordinates;
  accuracy?: number;
  locationSource?: LocationSource;
  darkStoreId?: string;
  darkStoreName?: string;
  deliveryEtaMinutes?: number;
  isServiceable?: boolean;
}

export interface SaveLocationPayload {
  latitude: number;
  longitude: number;
  accuracy?: number;
  locationSource: LocationSource;
  isUserConfirmed: boolean;
  houseNo?: string;
  landmark?: string;
  street?: string;
  locality?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  fullAddress?: string;
  addressDetails?: Partial<ReverseGeocodeResult> | Record<string, any>;
}

export interface DeliveryLocation {
  id?: string;
  areaId?: string;
  area: string; // e.g. "Shop no. 1, Kahan Park, nr. Varachha"
  society?: string; // Society / Apartment / Building name
  houseNo?: string; // House / Flat / Shop number
  landmark?: string; // Landmark / nearby reference
  formattedAddress: string;
  street?: string;
  road?: string;
  locality?: string;
  city: string;
  state: string;
  country?: string;
  pincode: string;
  postalCode?: string;
  coordinates?: GeoCoordinates;
  accuracy?: number;
  locationSource?: LocationSource;
  deliveryEtaMinutes: number;
  isServiceable: boolean;
  darkStoreId?: string;
  darkStoreName?: string;
  storeDistanceKm?: number;
  storeAddress?: string;
  addressType?: string;
  savedAddressId?: string;
}

export interface SavedAddress {
  id: string;
  type: "home" | "work" | "other";
  title: string;
  addressLine: string;
  landmark?: string;
  area: string;
  city: string;
  pincode: string;
  countryId?: string;
  stateId?: string;
  cityId?: string;
  pincodeId?: string;
  areaId?: string;
  stateName?: string;
  countryName?: string;
  coordinates?: GeoCoordinates;
  isDefault: boolean;
  receiverName?: string;
  receiverPhone?: string;
}

export interface CountryItem {
  id: string;
  name: string;
  code: string;
  dial_code?: string;
  is_active?: boolean;
}

export interface StateItem {
  id: string;
  country_id: string;
  name: string;
  code?: string;
  is_active?: boolean;
}

export interface CityItem {
  id: string;
  state_id: string;
  name: string;
  is_active?: boolean;
}

export interface PincodeItem {
  id: string;
  city_id: string;
  code: string;
  is_active?: boolean;
}

export interface AreaItem {
  id: string;
  city_id?: string;
  pincode_id?: string;
  name: string;
  slug?: string;
  latitude?: string | number;
  longitude?: string | number;
  is_active?: boolean;
}
