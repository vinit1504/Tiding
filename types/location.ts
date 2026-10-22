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
  coordinates?: GeoCoordinates;
  isDefault: boolean;
  receiverName?: string;
  receiverPhone?: string;
}
