import { atom } from "jotai";
import { DeliveryLocation } from "@/types/location";

const defaultLocation: DeliveryLocation = {
  area: "Bopal",
  society: "South Bopal",
  houseNo: "Shop No. 1",
  landmark: "Near Bopal Lake",
  formattedAddress: "Bopal, Ahmedabad, Gujarat 380058",
  city: "Ahmedabad",
  state: "Gujarat",
  pincode: "380058",
  coordinates: { latitude: 23.0345, longitude: 72.4682 },
  deliveryEtaMinutes: 15,
  isServiceable: true,
  darkStoreId: "2a6ba8df-637f-4939-bc17-69ad6832c050",
  darkStoreName: "Tiding Daily - Bopal",
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
