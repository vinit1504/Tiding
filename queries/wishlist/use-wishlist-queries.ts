"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { wishlistService } from "@/lib/api/wishlist-service";
import { QUERY_KEYS } from "@/queries/query-keys";
import {
  wishlistIdsAtom,
  wishlistProductIdsAtom,
  wishlistVariantIdsAtom,
  wishlistItemIdMapAtom,
  customerWishlistItemsAtom,
  wishlistServerCountAtom,
} from "@/stores";
import {
  CustomerWishlistQuery,
  CustomerWishlistResponse,
  AddWishlistItemPayload,
  UpdateWishlistItemPayload,
  CreateWishlistPayload,
  UpdateWishlistPayload,
  Wishlist,
  WishlistItem,
} from "@/types/wishlist";
import { toast } from "sonner";

// ======================== QUERIES ========================

/**
 * 1. Location-Aware Customer Wishlist
 */
export function useCustomerWishlistQuery(params: CustomerWishlistQuery = {}) {
  const setLoadedItems = useSetAtom(customerWishlistItemsAtom);
  const setProductIds = useSetAtom(wishlistProductIdsAtom);
  const setVariantIds = useSetAtom(wishlistVariantIdsAtom);
  const setItemMap = useSetAtom(wishlistItemIdMapAtom);
  const setServerCount = useSetAtom(wishlistServerCountAtom);

  return useQuery({
    queryKey: QUERY_KEYS.WISHLISTS.CUSTOMER(params as Record<string, unknown>),
    queryFn: async () => {
      const data = await wishlistService.getCustomerWishlist(params);
      if (data?.items) {
        setLoadedItems(data.items);
        const pIds: string[] = [];
        const vIds: string[] = [];
        const itemMap: Record<string, string> = {};

        data.items.forEach((item) => {
          if (item.productId) {
            pIds.push(item.productId);
            itemMap[item.productId] = item.id;
          }
          if (item.variantId) {
            vIds.push(item.variantId);
            itemMap[item.variantId] = item.id;
          }
        });

        const distinctPIds = Array.from(new Set(pIds));
        setProductIds(distinctPIds);
        setVariantIds(Array.from(new Set(vIds)));
        setItemMap(itemMap);
        setServerCount(data.total ?? data.items.length);
      }
      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * 2. Lightweight Heart Icons Sync IDs
 */
export function useWishlistIdsQuery() {
  const setProductIds = useSetAtom(wishlistProductIdsAtom);
  const setVariantIds = useSetAtom(wishlistVariantIdsAtom);
  const setItemMap = useSetAtom(wishlistItemIdMapAtom);
  const setServerCount = useSetAtom(wishlistServerCountAtom);
  const setLoadedItems = useSetAtom(customerWishlistItemsAtom);

  return useQuery({
    queryKey: QUERY_KEYS.WISHLISTS.IDS(),
    queryFn: async () => {
      const data = await wishlistService.getWishlistIds();

      // Clean up any stale legacy localStorage keys
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("tiding_wishlist_ids");
        } catch {}
      }

      let pIds: string[] = [];
      let vIds: string[] = [];
      const itemMap: Record<string, string> = {};

      if (Array.isArray(data)) {
        pIds = data.map(String);
      } else {
        pIds = Array.isArray(data?.productIds) ? data.productIds.map(String) : [];
        vIds = Array.isArray(data?.variantIds) ? data.variantIds.map(String) : [];

        if (Array.isArray(data?.items) && data.items.length > 0) {
          data.items.forEach((item) => {
            const pId = item.productId || (item as any).product_id;
            const vId = item.variantId || (item as any).variant_id;
            if (pId) {
              itemMap[pId] = item.id;
              pIds.push(pId);
            }
            if (vId) {
              itemMap[vId] = item.id;
              vIds.push(vId);
            }
          });
          setLoadedItems(data.items);
        }
      }

      const distinctPIds = Array.from(new Set(pIds));
      const distinctVIds = Array.from(new Set(vIds));
      const totalCount = Array.isArray(data?.items) && data.items.length > 0
        ? data.items.length
        : distinctPIds.length;

      setProductIds(distinctPIds);
      setVariantIds(distinctVIds);
      setItemMap(itemMap);
      setServerCount(totalCount);

      return data;
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * 3. List My Wishlists
 */
export function useMyWishlistsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.WISHLISTS.MY(),
    queryFn: () => wishlistService.getMyWishlists(),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * 4. Get Public Shared Wishlist
 */
export function usePublicWishlistQuery(shareToken: string) {
  return useQuery({
    queryKey: QUERY_KEYS.WISHLISTS.PUBLIC(shareToken),
    queryFn: () => wishlistService.getPublicWishlist(shareToken),
    enabled: !!shareToken,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Single Wishlist by ID
 */
export function useWishlistDetailQuery(wishlistId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.WISHLISTS.DETAIL(wishlistId),
    queryFn: () => wishlistService.getWishlistById(wishlistId),
    enabled: !!wishlistId,
  });
}

// ======================== MUTATIONS ========================

/**
 * Add Item to Wishlist
 */
export function useAddToWishlistMutation() {
  const queryClient = useQueryClient();
  const setProductIds = useSetAtom(wishlistProductIdsAtom);
  const setVariantIds = useSetAtom(wishlistVariantIdsAtom);
  const setItemMap = useSetAtom(wishlistItemIdMapAtom);
  const setServerCount = useSetAtom(wishlistServerCountAtom);

  return useMutation({
    mutationFn: (payload: AddWishlistItemPayload) =>
      wishlistService.addItem(payload),
    onMutate: async (payload) => {
      // Optimistic update: 1 product = 1 count
      if (payload.productId) {
        setProductIds((prev) => Array.from(new Set([...prev, payload.productId])));
      }
      if (payload.variantId) {
        const vId = payload.variantId;
        setVariantIds((prev) => Array.from(new Set([...prev, vId])));
      }
      setServerCount((prev) => (typeof prev === "number" ? prev + 1 : 1));
    },
    onSuccess: (data, variables) => {
      if (data?.id) {
        setItemMap((prev) => ({
          ...prev,
          [variables.productId]: data.id,
          ...(variables.variantId ? { [variables.variantId]: data.id } : {}),
        }));
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLISTS.ALL });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to add item to wishlist");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLISTS.IDS() });
    },
  });
}

/**
 * Update Wishlist Item
 */
export function useUpdateWishlistItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      payload,
    }: {
      itemId: string;
      payload: UpdateWishlistItemPayload;
    }) => wishlistService.updateItem(itemId, payload),
    onSuccess: () => {
      toast.success("Wishlist item updated");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLISTS.ALL });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update wishlist item");
    },
  });
}

/**
 * Remove Item from Wishlist
 */
export function useRemoveFromWishlistMutation() {
  const queryClient = useQueryClient();
  const setProductIds = useSetAtom(wishlistProductIdsAtom);
  const setVariantIds = useSetAtom(wishlistVariantIdsAtom);
  const setItemMap = useSetAtom(wishlistItemIdMapAtom);
  const setCustomerItems = useSetAtom(customerWishlistItemsAtom);
  const setServerCount = useSetAtom(wishlistServerCountAtom);

  return useMutation({
    mutationFn: ({
      itemId,
      productId,
      variantId,
    }: {
      itemId: string;
      productId?: string;
      variantId?: string;
    }) => wishlistService.removeItem(itemId),
    onMutate: async ({ itemId, productId, variantId }) => {
      // Optimistic removal
      setCustomerItems((prev) => prev.filter((item) => item.id !== itemId));

      if (productId) {
        setProductIds((prev) => prev.filter((id) => id !== productId));
      }
      if (variantId) {
        setVariantIds((prev) => prev.filter((id) => id !== variantId));
      }
      setItemMap((prev) => {
        const next = { ...prev };
        if (productId) delete next[productId];
        if (variantId) delete next[variantId];
        return next;
      });
      setServerCount((prev) => (typeof prev === "number" && prev > 0 ? prev - 1 : 0));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLISTS.ALL });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to remove item from wishlist");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLISTS.ALL });
    },
  });
}

/**
 * Clear Wishlist Items
 */
export function useClearWishlistMutation() {
  const queryClient = useQueryClient();
  const setProductIds = useSetAtom(wishlistProductIdsAtom);
  const setVariantIds = useSetAtom(wishlistVariantIdsAtom);
  const setItemMap = useSetAtom(wishlistItemIdMapAtom);
  const setCustomerItems = useSetAtom(customerWishlistItemsAtom);
  const setServerCount = useSetAtom(wishlistServerCountAtom);

  return useMutation({
    mutationFn: () => wishlistService.clearWishlist(),
    onMutate: async () => {
      setCustomerItems([]);
      setProductIds([]);
      setVariantIds([]);
      setItemMap({});
      setServerCount(0);
    },
    onSuccess: () => {
      toast.success("Wishlist cleared");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLISTS.ALL });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to clear wishlist");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLISTS.ALL });
    },
  });
}

/**
 * 1-Click Move Wishlist Item to Cart
 */
export function useMoveWishlistItemToCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, areaId }: { itemId: string; areaId?: string }) =>
      wishlistService.addItemToCart(itemId, areaId),
    onSuccess: () => {
      toast.success("Item moved to cart!");
      // Invalidate both Cart and Wishlist
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLISTS.ALL });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Could not move item to cart");
    },
  });
}

/**
 * Bulk Move All Wishlist Items to Cart
 */
export function useMoveAllWishlistToCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (wishlistId: string) => wishlistService.moveAllToCart(wishlistId),
    onSuccess: (data) => {
      const count = data?.transferredCount;
      toast.success(
        count !== undefined
          ? `Transferred ${count} in-stock item(s) to your cart!`
          : "In-stock items transferred to your cart!"
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLISTS.ALL });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to move items to cart");
    },
  });
}

/**
 * Generate / Toggle Public Share Link
 */
export function useShareWishlistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (wishlistId: string) =>
      wishlistService.generateShareLink(wishlistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLISTS.ALL });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to generate share link");
    },
  });
}

/**
 * Set as Default Wishlist
 */
export function useSetDefaultWishlistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (wishlistId: string) =>
      wishlistService.setDefaultWishlist(wishlistId),
    onSuccess: () => {
      toast.success("Default wishlist updated");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLISTS.ALL });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to set default wishlist");
    },
  });
}

/**
 * Create Custom Wishlist
 */
export function useCreateWishlistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWishlistPayload) =>
      wishlistService.createWishlist(payload),
    onSuccess: () => {
      toast.success("Wishlist created successfully!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLISTS.ALL });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create wishlist");
    },
  });
}

/**
 * Update Wishlist
 */
export function useUpdateWishlistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      wishlistId,
      payload,
    }: {
      wishlistId: string;
      payload: UpdateWishlistPayload;
    }) => wishlistService.updateWishlist(wishlistId, payload),
    onSuccess: () => {
      toast.success("Wishlist updated");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLISTS.ALL });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update wishlist");
    },
  });
}

/**
 * Delete Wishlist
 */
export function useDeleteWishlistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (wishlistId: string) =>
      wishlistService.deleteWishlist(wishlistId),
    onSuccess: () => {
      toast.success("Wishlist removed");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLISTS.ALL });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete wishlist");
    },
  });
}

/**
 * Restore Soft-Deleted Wishlist
 */
export function useRestoreWishlistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (wishlistId: string) =>
      wishlistService.restoreWishlist(wishlistId),
    onSuccess: () => {
      toast.success("Wishlist restored!");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WISHLISTS.ALL });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to restore wishlist");
    },
  });
}
