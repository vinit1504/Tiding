export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface DeliveryLocation {
  id?: string;
  areaId?: string;
  area: string; // e.g. "Shop no. 1, Kahan Park, nr. Varachha"
  society?: string; // Society / Apartment / Building name
  houseNo?: string; // House / Flat / Shop number
  landmark?: string; // Landmark / nearby reference
  formattedAddress: string;
  city: string;
  state: string;
  pincode: string;
  coordinates?: GeoCoordinates;
  deliveryEtaMinutes: number;
  isServiceable: boolean;
  darkStoreId?: string;
  darkStoreName?: string;
  storeDistanceKm?: number;
  storeAddress?: string;
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

