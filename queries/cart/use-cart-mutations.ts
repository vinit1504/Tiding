"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { cartService, normalizeBackendCartItem } from "@/lib/api/cart-service";
import { QUERY_KEYS } from "@/queries/query-keys";
import {
  persistentCartAtom,
  persistentSavedForLaterAtom,
  serverCartSummaryAtom,
  appliedCouponAtom,
  estimatedShippingFeeAtom,
  deliveryPincodeAtom,
  checkoutValidationAtom,
  isCartSyncingAtom,
  deduplicateCartItems,
} from "@/stores";
import {
  AddItemToCartPayload,
  CartSummaryResponse,
  CheckoutValidationResult,
} from "@/types/cart";
import { getStoredAccessToken } from "@/lib/auth/token-storage";

export const recentlyRemovedItemIds = new Set<string>();

export function markItemAsRemoved(id: string) {
  if (!id) return;
  recentlyRemovedItemIds.add(id);
  setTimeout(() => {
    recentlyRemovedItemIds.delete(id);
  }, 5000);
}

function matchesCartItem(localItem: any, b: any): boolean {
  if (!localItem || !b) return false;
  // 1. Direct server cartItemId match
  if (localItem.cartItemId && b.cartItemId && localItem.cartItemId === b.cartItemId) {
    return true;
  }
  if (localItem.cartItemId && b.id && localItem.cartItemId === b.id) {
    return true;
  }
  // 2. Exact id match
  if (localItem.id && b.id && localItem.id === b.id) {
    return true;
  }
  // 3. Variant match:
  // If either has a variant, they MUST match by variantId!
  const localHasVariant = !!localItem.variantId && localItem.variantId !== localItem.productId;
  const bHasVariant = !!b.variantId && b.variantId !== b.productId;

  if (localHasVariant || bHasVariant) {
    if (localItem.variantId && b.variantId && localItem.variantId === b.variantId) {
      return true;
    }
    if (localItem.id && b.variantId && localItem.id === b.variantId) {
      return true;
    }
    if (b.id && localItem.variantId && b.id === localItem.variantId) {
      return true;
    }
    return false;
  }

  // 4. Product match ONLY when neither has a distinct variant
  if (localItem.productId && b.productId && localItem.productId === b.productId) {
    return true;
  }
  return false;
}

export function useMyCartQuery() {
  const setCartItems = useSetAtom(persistentCartAtom);
  const setSavedForLater = useSetAtom(persistentSavedForLaterAtom);
  const setServerSummary = useSetAtom(serverCartSummaryAtom);
  const setAppliedCoupon = useSetAtom(appliedCouponAtom);
  const token = typeof window !== "undefined" ? getStoredAccessToken() : null;

  return useQuery({
    queryKey: QUERY_KEYS.CART.DETAIL(),
    queryFn: async () => {
      const summary = await cartService.getMyCart();
      if (summary) {
        setServerSummary(summary);
        if (Array.isArray(summary.active_items)) {
          const backendItems = summary.active_items
            .map(normalizeBackendCartItem)
            .filter(
              (b) =>
                !recentlyRemovedItemIds.has(b.id) &&
                !recentlyRemovedItemIds.has(b.variantId || "") &&
                !recentlyRemovedItemIds.has(b.cartItemId || "") &&
                !recentlyRemovedItemIds.has(b.productId || "")
            );

          setCartItems((prevItems: any[]) => {
            if (!prevItems || prevItems.length === 0) {
              return backendItems;
            }
            // Preserve local items, associate server cartItemId
            const updated = prevItems
              .filter(
                (l) =>
                  !recentlyRemovedItemIds.has(l.id) &&
                  !recentlyRemovedItemIds.has(l.variantId || "") &&
                  !recentlyRemovedItemIds.has(l.cartItemId || "") &&
                  !recentlyRemovedItemIds.has(l.productId || "")
              )
              .map((localItem) => {
                const match = backendItems.find((b) => matchesCartItem(localItem, b));
                if (match) {
                  return {
                    ...match,
                    cartItemId: match.cartItemId || localItem.cartItemId,
                    quantity: localItem.quantity,
                  };
                }
                return localItem;
              });

            const missing = backendItems.filter(
              (b) => !updated.some((l) => matchesCartItem(l, b))
            );

            return deduplicateCartItems([...updated, ...missing]);
          });
        }
        if (Array.isArray(summary.saved_for_later_items)) {
          setSavedForLater(summary.saved_for_later_items.map(normalizeBackendCartItem));
        }
        if (summary.coupon_code) {
          setAppliedCoupon({
            code: summary.coupon_code,
            discount: Number(summary.discount_total || 0),
          });
        }
      }
      return summary;
    },
    enabled: !!token && token !== "token_vinit_default",
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

function syncStateFromSummary(
  summary: CartSummaryResponse,
  setCartItems: any,
  setSavedForLater: any,
  setServerSummary: any,
  setAppliedCoupon: any,
  setEstimatedShippingFee: any
) {
  setServerSummary(summary);
  if (Array.isArray(summary.active_items)) {
    const backendItems = summary.active_items
      .map(normalizeBackendCartItem)
      .filter(
        (b) =>
          !recentlyRemovedItemIds.has(b.id) &&
          !recentlyRemovedItemIds.has(b.variantId || "") &&
          !recentlyRemovedItemIds.has(b.cartItemId || "") &&
          !recentlyRemovedItemIds.has(b.productId || "")
      );

    setCartItems((prevItems: any[]) => {
      if (!prevItems || prevItems.length === 0) {
        return backendItems;
      }
      // Associate backend cartItemId, but retain latest user optimistic quantity
      const updated = prevItems
        .filter(
          (l) =>
            !recentlyRemovedItemIds.has(l.id) &&
            !recentlyRemovedItemIds.has(l.variantId || "") &&
            !recentlyRemovedItemIds.has(l.cartItemId || "") &&
            !recentlyRemovedItemIds.has(l.productId || "")
        )
        .map((localItem) => {
          const backendMatch = backendItems.find((b) => matchesCartItem(localItem, b));
          if (backendMatch) {
            return {
              ...backendMatch,
              cartItemId: backendMatch.cartItemId || localItem.cartItemId,
              quantity: localItem.quantity,
            };
          }
          return localItem;
        });

      const missing = backendItems.filter(
        (b) => !updated.some((l) => matchesCartItem(l, b))
      );

      return deduplicateCartItems([...updated, ...missing]);
    });
  }
  if (Array.isArray(summary.saved_for_later_items)) {
    setSavedForLater(deduplicateCartItems(summary.saved_for_later_items.map(normalizeBackendCartItem)));
  }
  if (summary.coupon_code) {
    setAppliedCoupon({
      code: summary.coupon_code,
      discount: Number(summary.discount_total || 0),
    });
  } else {
    setAppliedCoupon(null);
  }
  if (typeof summary.shipping_total !== "undefined") {
    setEstimatedShippingFee(Number(summary.shipping_total));
  }
}

export function useAddToCartMutation() {
  const queryClient = useQueryClient();
  const setCartItems = useSetAtom(persistentCartAtom);
  const setSavedForLater = useSetAtom(persistentSavedForLaterAtom);
  const setServerSummary = useSetAtom(serverCartSummaryAtom);
  const setAppliedCoupon = useSetAtom(appliedCouponAtom);
  const setEstimatedShippingFee = useSetAtom(estimatedShippingFeeAtom);
  const setIsSyncing = useSetAtom(isCartSyncingAtom);

  return useMutation({
    mutationFn: async (payload: AddItemToCartPayload) => {
      setIsSyncing(true);
      try {
        return await cartService.addItem(payload);
      } finally {
        setIsSyncing(false);
      }
    },
    onSuccess: (summary) => {
      syncStateFromSummary(
        summary,
        setCartItems,
        setSavedForLater,
        setServerSummary,
        setAppliedCoupon,
        setEstimatedShippingFee
      );
      queryClient.setQueryData(QUERY_KEYS.CART.DETAIL(), summary);
    },
  });
}

export function useUpdateCartItemQuantityMutation() {
  const queryClient = useQueryClient();
  const setCartItems = useSetAtom(persistentCartAtom);
  const setSavedForLater = useSetAtom(persistentSavedForLaterAtom);
  const setServerSummary = useSetAtom(serverCartSummaryAtom);
  const setAppliedCoupon = useSetAtom(appliedCouponAtom);
  const setEstimatedShippingFee = useSetAtom(estimatedShippingFeeAtom);
  const setIsSyncing = useSetAtom(isCartSyncingAtom);

  return useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) => {
      setIsSyncing(true);
      try {
        return await cartService.updateItemQuantity(cartItemId, quantity);
      } finally {
        setIsSyncing(false);
      }
    },
    onSuccess: (summary) => {
      syncStateFromSummary(
        summary,
        setCartItems,
        setSavedForLater,
        setServerSummary,
        setAppliedCoupon,
        setEstimatedShippingFee
      );
      queryClient.setQueryData(QUERY_KEYS.CART.DETAIL(), summary);
    },
  });
}

export function useRemoveCartItemMutation() {
  const queryClient = useQueryClient();
  const setCartItems = useSetAtom(persistentCartAtom);
  const setSavedForLater = useSetAtom(persistentSavedForLaterAtom);
  const setServerSummary = useSetAtom(serverCartSummaryAtom);
  const setAppliedCoupon = useSetAtom(appliedCouponAtom);
  const setEstimatedShippingFee = useSetAtom(estimatedShippingFeeAtom);
  const setIsSyncing = useSetAtom(isCartSyncingAtom);

  return useMutation({
    mutationFn: async (cartItemId: string) => {
      setIsSyncing(true);
      try {
        return await cartService.removeItem(cartItemId);
      } finally {
        setIsSyncing(false);
      }
    },
    onSuccess: (summary) => {
      syncStateFromSummary(
        summary,
        setCartItems,
        setSavedForLater,
        setServerSummary,
        setAppliedCoupon,
        setEstimatedShippingFee
      );
      queryClient.setQueryData(QUERY_KEYS.CART.DETAIL(), summary);
    },
  });
}

export function useSaveForLaterMutation() {
  const queryClient = useQueryClient();
  const setCartItems = useSetAtom(persistentCartAtom);
  const setSavedForLater = useSetAtom(persistentSavedForLaterAtom);
  const setServerSummary = useSetAtom(serverCartSummaryAtom);
  const setAppliedCoupon = useSetAtom(appliedCouponAtom);
  const setEstimatedShippingFee = useSetAtom(estimatedShippingFeeAtom);
  const setIsSyncing = useSetAtom(isCartSyncingAtom);

  return useMutation({
    mutationFn: async (cartItemId: string) => {
      setIsSyncing(true);
      try {
        return await cartService.saveForLater(cartItemId);
      } finally {
        setIsSyncing(false);
      }
    },
    onSuccess: (summary) => {
      syncStateFromSummary(
        summary,
        setCartItems,
        setSavedForLater,
        setServerSummary,
        setAppliedCoupon,
        setEstimatedShippingFee
      );
      queryClient.setQueryData(QUERY_KEYS.CART.DETAIL(), summary);
    },
  });
}

export function useMoveToCartMutation() {
  const queryClient = useQueryClient();
  const setCartItems = useSetAtom(persistentCartAtom);
  const setSavedForLater = useSetAtom(persistentSavedForLaterAtom);
  const setServerSummary = useSetAtom(serverCartSummaryAtom);
  const setAppliedCoupon = useSetAtom(appliedCouponAtom);
  const setEstimatedShippingFee = useSetAtom(estimatedShippingFeeAtom);
  const setIsSyncing = useSetAtom(isCartSyncingAtom);

  return useMutation({
    mutationFn: async (cartItemId: string) => {
      setIsSyncing(true);
      try {
        return await cartService.moveToCart(cartItemId);
      } finally {
        setIsSyncing(false);
      }
    },
    onSuccess: (summary) => {
      syncStateFromSummary(
        summary,
        setCartItems,
        setSavedForLater,
        setServerSummary,
        setAppliedCoupon,
        setEstimatedShippingFee
      );
      queryClient.setQueryData(QUERY_KEYS.CART.DETAIL(), summary);
    },
  });
}

export function useValidateCheckoutMutation() {
  const setValidation = useSetAtom(checkoutValidationAtom);

  return useMutation({
    mutationFn: async (): Promise<CheckoutValidationResult> => {
      return await cartService.validateCheckout();
    },
    onSuccess: (data) => {
      setValidation(data);
    },
  });
}

export function useEstimateShippingMutation() {
  const queryClient = useQueryClient();
  const setCartItems = useSetAtom(persistentCartAtom);
  const setSavedForLater = useSetAtom(persistentSavedForLaterAtom);
  const setServerSummary = useSetAtom(serverCartSummaryAtom);
  const setAppliedCoupon = useSetAtom(appliedCouponAtom);
  const setEstimatedShippingFee = useSetAtom(estimatedShippingFeeAtom);
  const setPincode = useSetAtom(deliveryPincodeAtom);

  return useMutation({
    mutationFn: async (pincode: string) => {
      setPincode(pincode);
      return await cartService.estimateShipping(pincode);
    },
    onSuccess: (summary) => {
      syncStateFromSummary(
        summary,
        setCartItems,
        setSavedForLater,
        setServerSummary,
        setAppliedCoupon,
        setEstimatedShippingFee
      );
      queryClient.setQueryData(QUERY_KEYS.CART.DETAIL(), summary);
    },
  });
}

export function useClearCartMutation() {
  const queryClient = useQueryClient();
  const setCartItems = useSetAtom(persistentCartAtom);
  const setServerSummary = useSetAtom(serverCartSummaryAtom);
  const setAppliedCoupon = useSetAtom(appliedCouponAtom);
  const setEstimatedShippingFee = useSetAtom(estimatedShippingFeeAtom);

  return useMutation({
    mutationFn: async () => {
      return await cartService.clearCart();
    },
    onSuccess: (summary) => {
      if (summary && summary.active_items) {
        setCartItems(summary.active_items.map(normalizeBackendCartItem));
        setServerSummary(summary);
      } else {
        setCartItems([]);
        setServerSummary(null);
      }
      setAppliedCoupon(null);
      setEstimatedShippingFee(null);
      queryClient.setQueryData(QUERY_KEYS.CART.DETAIL(), summary || null);
    },
  });
}

export function useMergeGuestCartMutation() {
  const queryClient = useQueryClient();
  const setCartItems = useSetAtom(persistentCartAtom);
  const setSavedForLater = useSetAtom(persistentSavedForLaterAtom);
  const setServerSummary = useSetAtom(serverCartSummaryAtom);
  const setAppliedCoupon = useSetAtom(appliedCouponAtom);
  const setEstimatedShippingFee = useSetAtom(estimatedShippingFeeAtom);

  return useMutation({
    mutationFn: async (guestSessionId?: string) => {
      return await cartService.mergeGuestCart(guestSessionId);
    },
    onSuccess: (summary) => {
      if (summary) {
        syncStateFromSummary(
          summary,
          setCartItems,
          setSavedForLater,
          setServerSummary,
          setAppliedCoupon,
          setEstimatedShippingFee
        );
      }
      queryClient.setQueryData(QUERY_KEYS.CART.DETAIL(), summary);
    },
  });
}

export function useApplyCouponMutation() {
  const queryClient = useQueryClient();
  const setCartItems = useSetAtom(persistentCartAtom);
  const setSavedForLater = useSetAtom(persistentSavedForLaterAtom);
  const setServerSummary = useSetAtom(serverCartSummaryAtom);
  const setAppliedCoupon = useSetAtom(appliedCouponAtom);
  const setEstimatedShippingFee = useSetAtom(estimatedShippingFeeAtom);

  return useMutation({
    mutationFn: async (couponCode: string) => {
      return await cartService.applyCoupon(couponCode);
    },
    onSuccess: (summary) => {
      syncStateFromSummary(
        summary,
        setCartItems,
        setSavedForLater,
        setServerSummary,
        setAppliedCoupon,
        setEstimatedShippingFee
      );
      queryClient.setQueryData(QUERY_KEYS.CART.DETAIL(), summary);
    },
  });
}

export function useRemoveCouponMutation() {
  const queryClient = useQueryClient();
  const setCartItems = useSetAtom(persistentCartAtom);
  const setSavedForLater = useSetAtom(persistentSavedForLaterAtom);
  const setServerSummary = useSetAtom(serverCartSummaryAtom);
  const setAppliedCoupon = useSetAtom(appliedCouponAtom);
  const setEstimatedShippingFee = useSetAtom(estimatedShippingFeeAtom);

  return useMutation({
    mutationFn: async () => {
      return await cartService.removeCoupon();
    },
    onSuccess: (summary) => {
      syncStateFromSummary(
        summary,
        setCartItems,
        setSavedForLater,
        setServerSummary,
        setAppliedCoupon,
        setEstimatedShippingFee
      );
      queryClient.setQueryData(QUERY_KEYS.CART.DETAIL(), summary);
    },
  });
}
