import { atom } from "jotai";
import { DeliveryLocation } from "@/types/location";

const defaultLocation: DeliveryLocation = {
  area: "Shop no. 1, Kahan Park, nr. Varachha",
  society: "Kahan Park",
  houseNo: "Shop no. 1",
  landmark: "nr. Varachha",
  formattedAddress: "Shop no. 1, Kahan Park, nr. Varachha, Surat, Gujarat 395006",
  city: "Surat",
  state: "Gujarat",
  pincode: "395006",
  coordinates: { latitude: 21.2266, longitude: 72.8753 },
  deliveryEtaMinutes: 8,
  isServiceable: true,
  darkStoreId: "fe9cc1ee-a1e2-436d-86e0-9603bbd46684",
  darkStoreName: "Varachha Express Store",
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
      } catch {
        // storage quota
      }
    }
  }
);

// Boolean flag to track if the user has completed initial location check
export const hasUserSetLocationAtom = atom<boolean>(false);
