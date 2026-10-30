import { atom } from "jotai";
import { DeliveryLocation } from "@/types/location";

const defaultLocation: DeliveryLocation = {
  area: "",
  society: "",
  houseNo: "",
  landmark: "",
  formattedAddress: "",
  city: "",
  state: "",
  pincode: "",
  coordinates: { latitude: 0, longitude: 0 },
  deliveryEtaMinutes: 0,
  isServiceable: false,
};

// Server-safe initial location for SSR and initial hydration parity
export const deliveryLocationAtom = atom<DeliveryLocation>(defaultLocation);

// Persistent location setter atom
export const persistentLocationAtom = atom(
  (get) => get(deliveryLocationAtom),
  (get, set, newLocation: DeliveryLocation) => {
    set(deliveryLocationAtom, newLocation);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("tiding_delivery_location", JSON.stringify(newLocation));
        if (newLocation.darkStoreId) {
          document.cookie = `tiding_store_id=${encodeURIComponent(newLocation.darkStoreId)}; path=/; max-age=31536000; SameSite=Lax`;
        }
      } catch {
        // storage quota
      }
    }
  }
);

// Boolean flag to track if the user has completed initial location check
export const hasUserSetLocationAtom = atom<boolean>(false);

// Boolean loading indicator during dark store resolution
export const isLocatingStoreAtom = atom<boolean>(false);
