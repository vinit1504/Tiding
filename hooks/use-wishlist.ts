"use client";

import { useCallback, useMemo } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
  wishlistIdsAtom,
  wishlistItemIdMapAtom,
  wishlistCountAtom,
  customerWishlistItemsAtom,
} from "@/stores/wishlist-atom";
import {
  useWishlistIdsQuery,
  useCustomerWishlistQuery,
  useMyWishlistsQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useUpdateWishlistItemMutation,
  useClearWishlistMutation,
  useMoveWishlistItemToCartMutation,
  useMoveAllWishlistToCartMutation,
  useShareWishlistMutation,
  useSetDefaultWishlistMutation,
  useCreateWishlistMutation,
  useDeleteWishlistMutation,
} from "@/queries/wishlist/use-wishlist-queries";
import { AddWishlistItemPayload, WishlistItem, WishlistPriority } from "@/types/wishlist";
import { toast } from "sonner";
import { authSessionAtom } from "@/stores";
import { flyHeartToHeader } from "@/lib/utils/wishlist-animation";

export function useWishlist() {
  const [wishlistIds] = useAtom(wishlistIdsAtom);
  const [itemIdMap] = useAtom(wishlistItemIdMapAtom);
  const [customerItems] = useAtom(customerWishlistItemsAtom);
  const wishlistCount = useAtomValue(wishlistCountAtom);
  const session = useAtomValue(authSessionAtom);

  // Background ID sync query for heart icons
  const idsQuery = useWishlistIdsQuery();

  // Mutations
  const addMutation = useAddToWishlistMutation();
  const removeMutation = useRemoveFromWishlistMutation();
  const updateMutation = useUpdateWishlistItemMutation();
  const clearMutation = useClearWishlistMutation();
  const moveToCartMutation = useMoveWishlistItemToCartMutation();
  const moveAllToCartMutation = useMoveAllWishlistToCartMutation();
  const shareMutation = useShareWishlistMutation();
  const setDefaultMutation = useSetDefaultWishlistMutation();
  const createWishlistMutation = useCreateWishlistMutation();
  const deleteWishlistMutation = useDeleteWishlistMutation();

  const idSet = useMemo(() => new Set(wishlistIds), [wishlistIds]);

  /**
   * Fast O(1) check if a product or variant is currently wishlisted
   */
  const isWishlisted = useCallback(
    (productId?: string, variantId?: string): boolean => {
      if (variantId && idSet.has(variantId)) return true;
      if (productId && idSet.has(productId)) return true;
      return false;
    },
    [idSet]
  );

  /**
   * Finds the wishlistItemId if already saved
   */
  const getWishlistItemId = useCallback(
    (productId?: string, variantId?: string): string | undefined => {
      if (variantId && itemIdMap[variantId]) return itemIdMap[variantId];
      if (productId && itemIdMap[productId]) return itemIdMap[productId];
      const match = customerItems.find(
        (it) =>
          (variantId && it.variantId === variantId) ||
          (productId && it.productId === productId)
      );
      return match?.id;
    },
    [itemIdMap, customerItems]
  );

  /**
   * Add item to wishlist with optional priorities & notifications
   */
  const addToWishlist = useCallback(
    async (
      product: {
        id: string;
        variantId?: string;
        name?: string;
      },
      options?: {
        priority?: WishlistPriority;
        notifyOnPriceDrop?: boolean;
        notifyOnRestock?: boolean;
        notes?: string;
        triggerElement?: HTMLElement | null;
      }
    ) => {
      try {
        if (options?.triggerElement) {
          flyHeartToHeader(options.triggerElement);
        }

        const payload: AddWishlistItemPayload = {
          productId: product.id,
          variantId: product.variantId,
          priority: options?.priority || "HIGH",
          notifyOnPriceDrop: options?.notifyOnPriceDrop ?? true,
          notifyOnRestock: options?.notifyOnRestock ?? true,
          notes: options?.notes,
        };

        await addMutation.mutateAsync(payload);
        toast.success(
          product.name ? `Added ${product.name} to wishlist!` : "Added to wishlist!"
        );
      } catch (err: any) {
        toast.error(err?.message || "Failed to add to wishlist");
      }
    },
    [addMutation]
  );

  /**
   * Remove item from wishlist
   */
  const removeFromWishlist = useCallback(
    async (productId?: string, variantId?: string, customItemId?: string) => {
      const resolvedItemId = customItemId || getWishlistItemId(productId, variantId);
      if (!resolvedItemId) {
        // Fallback: try optimistic remove using productId
        if (productId || variantId) {
          removeMutation.mutate({
            itemId: (variantId || productId)!,
            productId,
            variantId,
          });
        }
        return;
      }

      try {
        await removeMutation.mutateAsync({
          itemId: resolvedItemId,
          productId,
          variantId,
        });
        toast.success("Removed from wishlist");
      } catch (err: any) {
        toast.error(err?.message || "Failed to remove from wishlist");
      }
    },
    [getWishlistItemId, removeMutation]
  );

  /**
   * Toggle item in/out of wishlist
   */
  const toggleWishlist = useCallback(
    async (
      product: {
        id: string;
        variantId?: string;
        name?: string;
      },
      triggerElement?: HTMLElement | null
    ) => {
      const currentlySaved = isWishlisted(product.id, product.variantId);

      if (currentlySaved) {
        await removeFromWishlist(product.id, product.variantId);
      } else {
        await addToWishlist(product, { triggerElement });
      }
    },
    [isWishlisted, removeFromWishlist, addToWishlist]
  );

  /**
   * Move single item to customer cart
   */
  const moveToCart = useCallback(
    async (itemId: string, areaId?: string) => {
      return await moveToCartMutation.mutateAsync({ itemId, areaId });
    },
    [moveToCartMutation]
  );

  /**
   * Bulk move all wishlist items to cart
   */
  const moveAllToCart = useCallback(
    async (wishlistId: string) => {
      return await moveAllToCartMutation.mutateAsync(wishlistId);
    },
    [moveAllToCartMutation]
  );

  return {
    wishlistIds,
    wishlistCount,
    customerItems,
    isWishlisted,
    getWishlistItemId,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    moveToCart,
    moveAllToCart,
    clearWishlist: clearMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    shareWishlist: shareMutation.mutateAsync,
    setDefaultWishlist: setDefaultMutation.mutateAsync,
    createWishlist: createWishlistMutation.mutateAsync,
    deleteWishlist: deleteWishlistMutation.mutateAsync,
    // Status
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
    isMovingToCart: moveToCartMutation.isPending,
    isMovingAllToCart: moveAllToCartMutation.isPending,
    isAuthenticated: !!session?.isAuthenticated,
    refetchIds: idsQuery.refetch,
  };
}
