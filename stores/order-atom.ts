import { atom } from "jotai";
import { PlacedOrderDetails } from "@/components/checkout/order-success-view";

const ACTIVE_ORDER_STORAGE_KEY = "tiding_active_placed_order";

// In-memory atom for the currently tracked live order
export const activeOrderAtom = atom<PlacedOrderDetails | null>(null);

// Persistent atom synced with localStorage so page refreshes and multi-page navigation keep the order tracking alive
export const persistentActiveOrderAtom = atom(
  (get) => get(activeOrderAtom),
  (get, set, newOrder: PlacedOrderDetails | null) => {
    set(activeOrderAtom, newOrder);
    if (typeof window !== "undefined") {
      try {
        if (newOrder) {
          localStorage.setItem(ACTIVE_ORDER_STORAGE_KEY, JSON.stringify(newOrder));
        } else {
          localStorage.removeItem(ACTIVE_ORDER_STORAGE_KEY);
        }
      } catch (err) {
        console.warn("Failed to persist active order to localStorage:", err);
      }
    }
  }
);

// Boolean flag to show/hide the bottom status bar banner
export const isBottomTrackerVisibleAtom = atom<boolean>(true);

