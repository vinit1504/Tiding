"use client";

import { useCallback } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { toast } from "sonner";
import {
  persistentCartAtom,
  persistentSavedForLaterAtom,
  cartCountAtom,
  savedForLaterCountAtom,
  billBreakdownAtom,
  appliedCouponAtom,
  deliveryPincodeAtom,
  estimatedShippingFeeAtom,
  isEstimatingShippingAtom,
  checkoutValidationAtom,
  isCartSyncingAtom,
  serverCartSummaryAtom,
} from "@/stores";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/queries/query-keys";
import {
  useAddToCartMutation,
  useUpdateCartItemQuantityMutation,
  useRemoveCartItemMutation,
  useSaveForLaterMutation,
  useMoveToCartMutation,
  useValidateCheckoutMutation,
  useEstimateShippingMutation,
  useClearCartMutation,
  useMergeGuestCartMutation,
  useApplyCouponMutation,
  useRemoveCouponMutation,
} from "@/queries/cart/use-cart-mutations";
import {
  CartItem,
  CartItemCustomAttributes,
  CheckoutValidationResult,
} from "@/types/cart";
import { Product, ProductVariant } from "@/types/product";
import { getStoredAccessToken } from "@/lib/auth/token-storage";
import { SITE_CONFIG } from "@/lib/constants/site-config";
import { getOrCreateGuestSessionId } from "@/lib/api/cart-service";
import { couponService } from "@/lib/api/coupon-service";
import { markItemAsRemoved } from "@/queries/cart/use-cart-mutations";

// Canonical key resolver so variantId, productId, and cartItemId all resolve to the same item
const keyToCanonicalMap = new Map<string, string>();

function registerItemKeys(keys: (string | undefined | null)[]): string {
  const validKeys = keys.filter((k): k is string => !!k && typeof k === "string" && k.trim() !== "");
  if (validKeys.length === 0) return "";
  let canonical = validKeys.find((k) => keyToCanonicalMap.has(k));
  if (canonical) {
    canonical = keyToCanonicalMap.get(canonical)!;
  } else {
    canonical = validKeys[0];
  }
  validKeys.forEach((k) => keyToCanonicalMap.set(k, canonical!));
  return canonical;
}

function getCanonicalKey(identifier: string): string {
  return keyToCanonicalMap.get(identifier) || identifier;
}

// Module-level debounce timers and pending target quantities
const itemDebounceTimers = new Map<string, NodeJS.Timeout>();
const pendingQuantities = new Map<string, number>();

export function useCart() {
  const [cartItems, setCartItems] = useAtom(persistentCartAtom);
  const [savedItems, setSavedItems] = useAtom(persistentSavedForLaterAtom);
  const cartCount = useAtomValue(cartCountAtom);
  const savedCount = useAtomValue(savedForLaterCountAtom);
  const bill = useAtomValue(billBreakdownAtom);
  const [appliedCoupon, setAppliedCoupon] = useAtom(appliedCouponAtom);
  const [deliveryPincode, setDeliveryPincode] = useAtom(deliveryPincodeAtom);
  const [isEstimating, setIsEstimating] = useAtom(isEstimatingShippingAtom);
  const setEstimatedFee = useSetAtom(estimatedShippingFeeAtom);
  const [checkoutValidation, setCheckoutValidation] = useAtom(checkoutValidationAtom);
  const isSyncing = useAtomValue(isCartSyncingAtom);
  const serverSummary = useAtomValue(serverCartSummaryAtom);

  const isAuthenticated = typeof window !== "undefined" && !!getStoredAccessToken();
  const queryClient = useQueryClient();

  const refetchServerCart = useCallback(() => {
    return queryClient.refetchQueries({ queryKey: QUERY_KEYS.CART.DETAIL() });
  }, [queryClient]);

  // Mutations
  const addMutation = useAddToCartMutation();
  const updateQtyMutation = useUpdateCartItemQuantityMutation();
  const removeMutation = useRemoveCartItemMutation();
  const saveForLaterMutation = useSaveForLaterMutation();
  const moveToCartMutation = useMoveToCartMutation();
  const validateCheckoutMutation = useValidateCheckoutMutation();
  const estimateShippingMutation = useEstimateShippingMutation();
  const clearMutation = useClearCartMutation();
  const mergeMutation = useMergeGuestCartMutation();
  const applyCouponMutation = useApplyCouponMutation();
  const removeCouponMutation = useRemoveCouponMutation();

  /**
   * Remove Item from Cart (Immediate local update + server call)
   */
  const removeItem = useCallback(
    async (identifier: string) => {
      const targetItem = cartItems.find(
        (item) =>
          item.cartItemId === identifier ||
          item.id === identifier ||
          (item.variantId && item.variantId === identifier) ||
          (!item.variantId && item.productId === identifier)
      );

      const hasVariant = !!targetItem?.variantId && targetItem.variantId !== targetItem.productId;
      const canonicalKey =
        registerItemKeys([
          targetItem?.cartItemId,
          targetItem?.variantId,
          targetItem?.id,
          !hasVariant ? targetItem?.productId : undefined,
          identifier,
        ]) || identifier;

      // Clear any pending debounce timer & target quantity
      const existingTimer = itemDebounceTimers.get(canonicalKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
        itemDebounceTimers.delete(canonicalKey);
      }
      pendingQuantities.delete(canonicalKey);

      // Mark IDs as removed so in-flight responses don't resurrect this item
      if (targetItem?.cartItemId) markItemAsRemoved(targetItem.cartItemId);
      if (targetItem?.variantId) markItemAsRemoved(targetItem.variantId);
      if (!hasVariant && targetItem?.productId) markItemAsRemoved(targetItem.productId);
      if (targetItem?.id) markItemAsRemoved(targetItem.id);
      if (identifier) markItemAsRemoved(identifier);

      // Instant optimistic local removal (0ms)
      setCartItems((prev) =>
        prev.filter((item) => {
          if (targetItem && item === targetItem) return false;
          if (item.cartItemId && item.cartItemId === identifier) return false;
          if (item.id === identifier) return false;
          if (item.variantId && item.variantId === identifier) return false;
          if (!hasVariant && !item.variantId && item.productId === identifier) return false;
          const key = item.cartItemId || item.variantId || item.id;
          if (getCanonicalKey(key) === canonicalKey) return false;
          return true;
        })
      );

      toast.success(`Removed ${targetItem?.name || "item"} from cart`);

      const resolvedCartItemId = targetItem?.cartItemId;

      if (isAuthenticated && resolvedCartItemId) {
        try {
          await removeMutation.mutateAsync(resolvedCartItemId);
        } catch (err: any) {
          console.warn("Server remove sync error:", err);
        }
      }
    },
    [cartItems, isAuthenticated, setCartItems, removeMutation]
  );

  /**
   * Update Cart Item Quantity with robust canonical debounce
   */
  const updateQuantity = useCallback(
    (identifier: string, quantity: number) => {
      const targetItem = cartItems.find(
        (item) =>
          item.cartItemId === identifier ||
          item.id === identifier ||
          (item.variantId && item.variantId === identifier) ||
          (!item.variantId && item.productId === identifier)
      );

      const hasVariant = !!targetItem?.variantId && targetItem.variantId !== targetItem.productId;
      const canonicalKey =
        registerItemKeys([
          targetItem?.cartItemId,
          targetItem?.variantId,
          targetItem?.id,
          !hasVariant ? targetItem?.productId : undefined,
          identifier,
        ]) || identifier;

      if (quantity <= 0) {
        return removeItem(identifier);
      }

      // 1. Instant optimistic local update (0ms latency)
      setCartItems((prev) =>
        prev.map((item) => {
          const isMatch =
            (targetItem && item === targetItem) ||
            (item.cartItemId && item.cartItemId === identifier) ||
            item.id === identifier ||
            (item.variantId && item.variantId === identifier) ||
            (!hasVariant && !item.variantId && item.productId === identifier) ||
            getCanonicalKey(item.cartItemId || item.variantId || item.id) === canonicalKey;

          if (isMatch) {
            return { ...item, quantity };
          }
          return item;
        })
      );

      if (!isAuthenticated) return;

      // 2. Clear any pending debounce timer
      const existingTimer = itemDebounceTimers.get(canonicalKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      pendingQuantities.set(canonicalKey, quantity);

      // 3. Debounce backend sync with 450ms
      const timer = setTimeout(async () => {
        itemDebounceTimers.delete(canonicalKey);
        const finalQuantity = pendingQuantities.get(canonicalKey);
        if (typeof finalQuantity === "undefined") return;

        const latestItem = cartItems.find(
          (item) =>
            item.cartItemId === identifier ||
            item.id === identifier ||
            (item.variantId && item.variantId === identifier) ||
            (!hasVariant && !item.variantId && item.productId === identifier) ||
            getCanonicalKey(item.cartItemId || item.variantId || item.id) === canonicalKey
        );

        const resolvedCartItemId = latestItem?.cartItemId;
        const variantId = latestItem?.variantId || latestItem?.id;

        if (finalQuantity <= 0) {
          pendingQuantities.delete(canonicalKey);
          if (resolvedCartItemId) {
            try {
              await removeMutation.mutateAsync(resolvedCartItemId);
            } catch (err: any) {
              console.warn("Server remove sync error:", err);
            }
          }
          return;
        }

        if (resolvedCartItemId) {
          try {
            await updateQtyMutation.mutateAsync({
              cartItemId: resolvedCartItemId,
              quantity: finalQuantity,
            });
            pendingQuantities.delete(canonicalKey);
          } catch (err: any) {
            console.warn("Server quantity sync failed:", err);
          }
          return;
        }

        if (variantId) {
          try {
            const summary = await addMutation.mutateAsync({
              variantId,
              quantity: finalQuantity,
              customAttributes: latestItem?.customAttributes,
            });
            pendingQuantities.delete(canonicalKey);
            if (summary?.active_items) {
              const serverMatch = summary.active_items.find(
                (si: any) =>
                  (hasVariant && (si.variant_id === variantId || si.id === variantId)) ||
                  (!hasVariant && (si.product_id === latestItem?.productId || si.variant_id === variantId || si.id === variantId))
              );
              if (serverMatch) {
                registerItemKeys([serverMatch.id, variantId]);
                setCartItems((prev) =>
                  prev.map((it) =>
                    (hasVariant ? (it.variantId === variantId || it.id === variantId) : (it.productId === latestItem?.productId || it.id === variantId))
                      ? { ...it, cartItemId: serverMatch.id }
                      : it
                  )
                );
              }
            }
          } catch (err: any) {
            console.warn("Server add to cart sync warning:", err);
          }
        }
      }, 450);

      itemDebounceTimers.set(canonicalKey, timer);
    },
    [cartItems, isAuthenticated, setCartItems, removeItem, updateQtyMutation, addMutation, removeMutation]
  );

  /**
   * Add Item to Cart (Optimistic + routes through updateQuantity if already in cart + debounced backend sync)
   */
  const addToCart = useCallback(
    async (
      productOrVariant: Product | { product: Product; variant?: ProductVariant },
      quantity: number = 1,
      customAttributes?: CartItemCustomAttributes
    ) => {
      const product = "product" in productOrVariant ? productOrVariant.product : productOrVariant;
      const variant =
        "product" in productOrVariant
          ? productOrVariant.variant
          : (product as any).selected_variant ||
            (product as any).default_variant ||
            (product.variants && product.variants.length > 0 ? product.variants[0] : undefined);

      const rawVariantId = variant?.id || (product as any).variantId;
      const hasVariant = !!rawVariantId && rawVariantId !== product.id;
      const lineItemId = rawVariantId || product.id;

      const price = variant?.selling_price ?? variant?.price ?? product.price;
      const mrp = variant?.mrp ?? product.mrp ?? price;
      const variantName = variant?.variant_name || (variant as any)?.name;
      const unit = variant?.unit || variantName || product.unit || "1 pack";
      const stock = variant?.stock_quantity ?? variant?.stock ?? product.stock ?? 20;

      // Clean item name incorporating variant if appropriate
      const displayName =
        variantName && !product.name.toLowerCase().includes(variantName.toLowerCase())
          ? `${product.name} (${variantName})`
          : product.name;

      const canonicalKey = registerItemKeys([
        lineItemId,
        !hasVariant ? product.id : undefined,
      ]);

      // If already in basket, delegate to debounced updateQuantity!
      // Must match specifically by variantId if variants exist so separate variants are NOT collapsed!
      const existing = cartItems.find((item) => {
        if (hasVariant) {
          return (
            item.variantId === lineItemId ||
            item.id === lineItemId ||
            (item.cartItemId && item.cartItemId === lineItemId)
          );
        }
        return (
          (!item.variantId || item.variantId === product.id) &&
          (item.productId === product.id || item.id === product.id)
        );
      });

      if (existing) {
        return updateQuantity(
          existing.cartItemId || existing.variantId || existing.id,
          existing.quantity + quantity
        );
      }

      // Optimistic local update for new item (0ms instant response)
      const newItem: CartItem = {
        id: lineItemId,
        productId: product.id,
        variantId: hasVariant ? lineItemId : undefined,
        name: displayName,
        slug: product.slug,
        image_url: variant?.image_url || product.image_url,
        unit,
        price,
        mrp,
        quantity,
        maxStock: stock,
        customAttributes,
      };
      setCartItems((prev) => [...prev, newItem]);

      if (!isAuthenticated || !lineItemId) return;

      // Debounce backend creation so rapid + clicks coalesce into 1 single call with final quantity!
      const existingTimer = itemDebounceTimers.get(canonicalKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      pendingQuantities.set(canonicalKey, quantity);

      const timer = setTimeout(async () => {
        itemDebounceTimers.delete(canonicalKey);
        const finalQuantity = pendingQuantities.get(canonicalKey);
        if (typeof finalQuantity === "undefined" || finalQuantity <= 0) return;

        try {
          const summary = await addMutation.mutateAsync({
            variantId: lineItemId,
            quantity: finalQuantity,
            customAttributes,
          });
          pendingQuantities.delete(canonicalKey);
          if (summary?.active_items) {
            const serverMatch = summary.active_items.find(
              (si: any) =>
                (hasVariant && (si.variant_id === lineItemId || si.id === lineItemId)) ||
                (!hasVariant && (si.product_id === product.id || si.variant_id === lineItemId || si.id === lineItemId))
            );
            if (serverMatch) {
              registerItemKeys([serverMatch.id, lineItemId]);
              setCartItems((prev) =>
                prev.map((it) => {
                  const isThisItem = hasVariant
                    ? it.variantId === lineItemId || it.id === lineItemId
                    : it.productId === product.id || it.id === lineItemId;
                  return isThisItem ? { ...it, cartItemId: serverMatch.id } : it;
                })
              );
            }
          }
        } catch (err: any) {
          console.warn("Server add to cart sync warning:", err);
        }
      }, 450);

      itemDebounceTimers.set(canonicalKey, timer);
    },
    [cartItems, isAuthenticated, setCartItems, addMutation, updateQuantity]
  );

  /**
   * Save Item for Later
   */
  const saveForLater = useCallback(
    async (identifier: string) => {
      const targetItem = cartItems.find(
        (item) =>
          item.cartItemId === identifier ||
          item.id === identifier ||
          (item.variantId && item.variantId === identifier) ||
          (!item.variantId && item.productId === identifier)
      );

      if (!targetItem) return;

      const hasVariant = !!targetItem.variantId && targetItem.variantId !== targetItem.productId;

      // Remove from active cart
      setCartItems((prev) =>
        prev.filter((item) => {
          if (item === targetItem) return false;
          if (item.cartItemId && item.cartItemId === identifier) return false;
          if (item.id === identifier) return false;
          if (item.variantId && item.variantId === identifier) return false;
          if (!hasVariant && !item.variantId && item.productId === identifier) return false;
          return true;
        })
      );

      // Add to saved for later
      setSavedItems((prev) => {
        const exists = prev.some(
          (it) =>
            it.id === targetItem.id ||
            (it.variantId && it.variantId === targetItem.variantId) ||
            it.cartItemId === targetItem.cartItemId
        );
        if (exists) return prev;
        return [...prev, { ...targetItem, isSavedForLater: true }];
      });

      toast.info(`Moved "${targetItem.name}" to Saved for Later`);

      if (isAuthenticated && targetItem.cartItemId) {
        try {
          await saveForLaterMutation.mutateAsync(targetItem.cartItemId);
        } catch (err: any) {
          console.warn("Server save-for-later sync warning:", err);
        }
      }
    },
    [cartItems, isAuthenticated, setCartItems, setSavedItems, saveForLaterMutation]
  );

  /**
   * Move Saved Item Back to Cart
   */
  const moveToCart = useCallback(
    async (identifier: string) => {
      const targetItem = savedItems.find(
        (item) =>
          item.cartItemId === identifier ||
          item.id === identifier ||
          (item.variantId && item.variantId === identifier) ||
          (!item.variantId && item.productId === identifier)
      );

      if (!targetItem) return;

      const hasVariant = !!targetItem.variantId && targetItem.variantId !== targetItem.productId;

      // Remove from saved for later
      setSavedItems((prev) =>
        prev.filter((item) => {
          if (item === targetItem) return false;
          if (item.cartItemId && item.cartItemId === identifier) return false;
          if (item.id === identifier) return false;
          if (item.variantId && item.variantId === identifier) return false;
          if (!hasVariant && !item.variantId && item.productId === identifier) return false;
          return true;
        })
      );

      // Add back to active cart
      setCartItems((prev) => {
        const exists = prev.find(
          (it) =>
            it.id === targetItem.id ||
            (it.variantId && targetItem.variantId && it.variantId === targetItem.variantId)
        );
        if (exists) {
          return prev.map((it) =>
            it === exists ? { ...it, quantity: it.quantity + 1 } : it
          );
        }
        return [...prev, { ...targetItem, isSavedForLater: false }];
      });

      toast.success(`Moved "${targetItem.name}" back to cart`);

      if (isAuthenticated && targetItem.cartItemId) {
        try {
          await moveToCartMutation.mutateAsync(targetItem.cartItemId);
        } catch (err: any) {
          console.warn("Server move-to-cart sync warning:", err);
        }
      }
    },
    [savedItems, isAuthenticated, setSavedItems, setCartItems, moveToCartMutation]
  );

  /**
   * Pre-Checkout Integrity Check
   */
  const validateCheckout = useCallback(async (): Promise<CheckoutValidationResult> => {
    if (isAuthenticated) {
      try {
        const result = await validateCheckoutMutation.mutateAsync();
        setCheckoutValidation(result);
        return result;
      } catch (err: any) {
        console.warn("validate-checkout error:", err);
      }
    }

    // Fallback integrity verification
    const warnings: CheckoutValidationResult["warnings"] = [];
    cartItems.forEach((item) => {
      if (item.quantity > item.maxStock) {
        warnings.push({
          itemId: item.id,
          variantId: item.variantId || item.id,
          productName: item.name,
          type: "INSUFFICIENT_STOCK",
          message: `Only ${item.maxStock} units of ${item.name} available. Quantity adjusted.`,
          requestedQuantity: item.quantity,
          availableStock: item.maxStock,
        });
      }
    });

    const fallbackResult: CheckoutValidationResult = {
      isCheckoutReady: warnings.length === 0,
      warnings,
    };
    setCheckoutValidation(fallbackResult);
    return fallbackResult;
  }, [isAuthenticated, cartItems, validateCheckoutMutation, setCheckoutValidation]);

  /**
   * Estimate Shipping Delivery based on pincode
   */
  const estimateShipping = useCallback(
    async (pincode: string) => {
      const cleanPincode = pincode.trim();
      if (!/^\d{6}$/.test(cleanPincode)) {
        toast.error("Please enter a valid 6-digit Indian PIN code");
        return;
      }

      setIsEstimating(true);
      setDeliveryPincode(cleanPincode);

      if (isAuthenticated) {
        try {
          await estimateShippingMutation.mutateAsync(cleanPincode);
          toast.success(`Shipping delivery charges calculated for PIN ${cleanPincode}`);
          return;
        } catch (err: any) {
          console.warn("Backend estimate shipping error:", err);
        } finally {
          setIsEstimating(false);
        }
      }

      // Guest simulation:
      setTimeout(() => {
        const isMetro = ["110001", "400001", "560001", "600001", "700001", "500001"].includes(
          cleanPincode
        );
        const fee = isMetro ? 15 : SITE_CONFIG.defaultDeliveryFee;
        setEstimatedFee(fee);
        setIsEstimating(false);
        toast.success(`Delivery available to ${cleanPincode}! Estimated fee: ₹${fee}`);
      }, 500);
    },
    [isAuthenticated, setIsEstimating, setDeliveryPincode, estimateShippingMutation, setEstimatedFee]
  );

  /**
   * Clear Active Cart
   */
  const clearCart = useCallback(async () => {
    setCartItems([]);
    setAppliedCoupon(null);
    setEstimatedFee(null);
    setCheckoutValidation(null);
    toast.info("Cart has been emptied");

    if (isAuthenticated) {
      try {
        await clearMutation.mutateAsync();
      } catch (err: any) {
        console.warn("Server clear cart warning:", err);
      }
    }
  }, [isAuthenticated, setCartItems, setAppliedCoupon, setEstimatedFee, setCheckoutValidation, clearMutation]);

  /**
   * Merge Guest Cart on Login
   */
  const mergeGuestCart = useCallback(async () => {
    const sessionId = getOrCreateGuestSessionId();
    if (isAuthenticated) {
      try {
        await mergeMutation.mutateAsync(sessionId);
        toast.success("Guest items synchronized with your account!");
      } catch (err: any) {
        console.warn("Guest cart merge warning:", err);
      }
    }
  }, [isAuthenticated, mergeMutation]);

  /**
   * Apply Coupon to Cart
   */
  const applyCoupon = useCallback(
    async (code: string) => {
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) {
        toast.error("Please enter a valid promo code");
        return;
      }

      // 1. Fetch live active coupons to validate minimum order value
      let matchedCoupon: any = null;
      try {
        const { coupons } = await couponService.listActiveCoupons({ isActive: true });
        matchedCoupon = coupons.find((c) => c.code.toUpperCase() === cleanCode);
      } catch (err) {
        console.warn("Coupon list validation warning:", err);
      }

      if (matchedCoupon) {
        const minCart = Number(matchedCoupon.min_cart_amount || 0);
        if (minCart > 0 && bill.itemTotal < minCart) {
          toast.error(
            `${matchedCoupon.code} requires a minimum order value of ₹${minCart}. Add ₹${minCart - bill.itemTotal} more to apply.`
          );
          return;
        }
      }

      if (isAuthenticated) {
        try {
          await applyCouponMutation.mutateAsync(cleanCode);
          toast.success(`Coupon "${cleanCode}" applied successfully!`);
          return;
        } catch (err: any) {
          toast.error(err?.message || `Coupon "${cleanCode}" is invalid or expired`);
          return;
        }
      }

      // Guest / Direct API validation
      if (!matchedCoupon) {
        toast.error(`Invalid or inactive coupon code "${cleanCode}"`);
        return;
      }

      let calculatedDiscount = 0;
      if (matchedCoupon.discount_type === "PERCENTAGE") {
        const raw = Math.round(bill.itemTotal * (Number(matchedCoupon.discount_value) / 100));
        const max = matchedCoupon.max_discount_amount ? Number(matchedCoupon.max_discount_amount) : raw;
        calculatedDiscount = Math.min(raw, max);
      } else {
        // FIXED_AMOUNT
        const discountVal = Number(matchedCoupon.discount_value);
        const maxVal = matchedCoupon.max_discount_amount ? Number(matchedCoupon.max_discount_amount) : discountVal;
        calculatedDiscount = Math.min(discountVal, maxVal || discountVal);
      }

      setAppliedCoupon({
        code: matchedCoupon.code,
        discount: Math.max(1, calculatedDiscount),
        description: matchedCoupon.description || `${matchedCoupon.name} applied`,
        minCartAmount: Number(matchedCoupon.min_cart_amount || 0),
      });
      toast.success(`Coupon "${matchedCoupon.code}" applied! Saved ₹${calculatedDiscount}`);
    },
    [isAuthenticated, bill, applyCouponMutation, setAppliedCoupon]
  );

  /**
   * Remove Coupon from Cart
   */
  const removeCoupon = useCallback(async () => {
    setAppliedCoupon(null);
    toast.info("Coupon discount removed");

    if (isAuthenticated) {
      try {
        await removeCouponMutation.mutateAsync();
      } catch (err: any) {
        console.warn("Server remove coupon warning:", err);
      }
    }
  }, [isAuthenticated, setAppliedCoupon, removeCouponMutation]);

  return {
    items: cartItems,
    savedItems,
    cartCount,
    savedCount,
    bill,
    appliedCoupon,
    deliveryPincode,
    isEstimating,
    checkoutValidation,
    isSyncing,
    serverSummary,
    isAuthenticated,
    addToCart,
    updateQuantity,
    removeItem,
    saveForLater,
    moveToCart,
    validateCheckout,
    estimateShipping,
    clearCart,
    mergeGuestCart,
    applyCoupon,
    removeCoupon,
    refetchServerCart,
  };
}
