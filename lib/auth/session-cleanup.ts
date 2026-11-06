"use client";

import { getDefaultStore } from "jotai";
import { getQueryClient } from "@/lib/query-client";
import { apiClient } from "@/lib/api/api-client";
import { clearStoredAuth } from "./token-storage";
import {
  userProfileAtom,
  authSessionAtom,
  cartItemsAtom,
  savedForLaterItemsAtom,
  wishlistProductIdsAtom,
  wishlistVariantIdsAtom,
  wishlistItemIdMapAtom,
  customerWishlistItemsAtom,
  wishlistServerCountAtom,
  serverCartSummaryAtom,
  appliedCouponAtom,
  checkoutValidationAtom,
} from "@/stores";

let isClearing = false;

/**
 * Centrally cleans up all customer-specific application state,
 * caches, stored tokens, and in-flight network requests on LOGOUT.
 */
export function clearAllUserSessionData(): void {
  if (typeof window === "undefined" || isClearing) return;
  isClearing = true;

  try {
    // 1. Abort any active in-flight HTTP requests from previous session
    try {
      apiClient.abortAll();
    } catch {
      // ignore
    }

    // 2. Cancel and clear TanStack Query cache completely
    try {
      const qc = getQueryClient();
      qc.cancelQueries();
      qc.clear();
    } catch {
      // ignore
    }

    // 3. Purge stored auth tokens and user profile from storage
    clearStoredAuth();

    // 4. Purge customer-specific localStorage items
    try {
      localStorage.removeItem("tiding_cart");
      localStorage.removeItem("tiding_cart_saved_for_later");
      localStorage.removeItem("tiding_wishlist_product_ids");
      localStorage.removeItem("tiding_wishlist_variant_ids");
      localStorage.removeItem("tiding_wishlist_item_map");
      localStorage.removeItem("tiding_wishlist_ids");
      localStorage.removeItem("tiding_auth_redirect");
    } catch {
      // ignore
    }

    // 5. Reset Jotai atoms in memory to clean initial state
    try {
      const store = getDefaultStore();
      store.set(userProfileAtom, null);
      store.set(authSessionAtom, { user: null, token: null, isAuthenticated: false });
      store.set(cartItemsAtom, []);
      store.set(savedForLaterItemsAtom, []);
      store.set(wishlistProductIdsAtom, []);
      store.set(wishlistVariantIdsAtom, []);
      store.set(wishlistItemIdMapAtom, {});
      store.set(customerWishlistItemsAtom, []);
      store.set(wishlistServerCountAtom, null);
      store.set(serverCartSummaryAtom, null);
      store.set(appliedCouponAtom, null);
      store.set(checkoutValidationAtom, null);
    } catch {
      // ignore
    }

    // 6. Broadcast event for cross-component and cross-tab synchronization
    try {
      window.dispatchEvent(new CustomEvent("tiding_auth_logout"));
    } catch {
      // ignore
    }
  } finally {
    isClearing = false;
  }
}

/**
 * Prepares the application state when initializing a NEW USER SESSION upon login/verify OTP.
 * Cancels old requests and clears queries from the previous session,
 * while preserving the guest cart so it can be merged into the new user account.
 */
export function prepareForNewUserSession(): void {
  if (typeof window === "undefined") return;

  // 1. Abort any previous pending requests to prevent response collision
  try {
    apiClient.abortAll();
  } catch {
    // ignore
  }

  // 2. Clear query client cache so old-user queries are purged
  try {
    const qc = getQueryClient();
    qc.cancelQueries();
    qc.clear();
  } catch {
    // ignore
  }

  // 3. Reset previous user wishlist and profile atoms in memory
  try {
    const store = getDefaultStore();
    store.set(userProfileAtom, null);
    store.set(authSessionAtom, { user: null, token: null, isAuthenticated: false });
    store.set(wishlistProductIdsAtom, []);
    store.set(wishlistVariantIdsAtom, []);
    store.set(wishlistItemIdMapAtom, {});
    store.set(customerWishlistItemsAtom, []);
    store.set(wishlistServerCountAtom, null);
  } catch {
    // ignore
  }
}
