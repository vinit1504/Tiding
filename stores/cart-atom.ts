import { atom } from "jotai";
import { CartItem, BillBreakdown, CartSummaryResponse, CheckoutValidationResult } from "@/types/cart";
import { CouponRecord } from "@/types/coupon";
import { SITE_CONFIG } from "@/lib/constants/site-config";

// Server-safe initial cart state to guarantee SSR and hydration parity
export const cartItemsAtom = atom<CartItem[]>([]);

/**
 * Deduplicate cart items by unique line identity (cartItemId, id, variantId, or productId)
 * and safely combine quantities if identical entries exist.
 */
export function deduplicateCartItems(items: CartItem[]): CartItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const result: CartItem[] = [];

  for (const item of items) {
    if (!item) continue;

    const existingIndex = result.findIndex((existing) => {
      // 1. Same cartItemId
      if (item.cartItemId && existing.cartItemId && item.cartItemId === existing.cartItemId) {
        return true;
      }
      // 2. Match variant line items
      const itemHasVariant = !!item.variantId && item.variantId !== item.productId;
      const existingHasVariant = !!existing.variantId && existing.variantId !== existing.productId;

      if (itemHasVariant || existingHasVariant) {
        if (item.variantId && existing.variantId && item.variantId === existing.variantId) {
          return true;
        }
        if (item.id && existing.variantId && item.id === existing.variantId) {
          return true;
        }
        if (existing.id && item.variantId && existing.id === item.variantId) {
          return true;
        }
        if (item.id && existing.id && item.id === existing.id) {
          return true;
        }
        return false;
      }

      // 3. Non-variant products: match by productId or item id
      if (item.productId && existing.productId && item.productId === existing.productId) {
        return true;
      }
      if (item.id && existing.id && item.id === existing.id) {
        return true;
      }
      return false;
    });

    if (existingIndex >= 0) {
      const existing = result[existingIndex];
      const mergedQty = (existing.quantity || 1) + (item.quantity || 1);
      result[existingIndex] = {
        ...existing,
        ...item,
        id: existing.id || item.id,
        cartItemId: existing.cartItemId || item.cartItemId,
        quantity: existing.maxStock ? Math.min(mergedQty, existing.maxStock) : mergedQty,
      };
    } else {
      result.push({ ...item });
    }
  }

  return result;
}

// Persistent wrapper atom to keep localStorage in sync
export const persistentCartAtom = atom(
  (get) => get(cartItemsAtom),
  (get, set, newCart: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    const rawUpdated = typeof newCart === "function" ? newCart(get(cartItemsAtom)) : newCart;
    const updated = deduplicateCartItems(rawUpdated);
    set(cartItemsAtom, updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("tiding_cart", JSON.stringify(updated));
      } catch {
        // storage quota exceeded or disabled
      }
    }
  }
);

// Saved for later items
export const savedForLaterItemsAtom = atom<CartItem[]>([]);

export const persistentSavedForLaterAtom = atom(
  (get) => get(savedForLaterItemsAtom),
  (get, set, newItems: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    const rawUpdated = typeof newItems === "function" ? newItems(get(savedForLaterItemsAtom)) : newItems;
    const updated = deduplicateCartItems(rawUpdated);
    set(savedForLaterItemsAtom, updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("tiding_cart_saved_for_later", JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  }
);

// Active coupons loaded from API
export const activeCouponsAtom = atom<CouponRecord[]>([]);

// Applied coupon state
export interface AppliedCouponState {
  code: string;
  discount: number;
  description?: string;
  minCartAmount?: number;
}

export const appliedCouponAtom = atom<AppliedCouponState | null>(null);

// Delivery estimation state
export const deliveryPincodeAtom = atom<string>("");
export const isEstimatingShippingAtom = atom<boolean>(false);
export const estimatedShippingFeeAtom = atom<number | null>(null);

// Checkout validation integrity state
export const checkoutValidationAtom = atom<CheckoutValidationResult | null>(null);

// Cart loading / syncing state
export const isCartSyncingAtom = atom<boolean>(false);

// Authoritative server cart summary (if loaded from backend)
export const serverCartSummaryAtom = atom<CartSummaryResponse | null>(null);

// Derived: Total number of active items in basket
export const cartCountAtom = atom((get) => {
  const items = get(cartItemsAtom);
  return items.reduce((sum, item) => sum + item.quantity, 0);
});

// Derived: Total number of saved for later items
export const savedForLaterCountAtom = atom((get) => {
  const items = get(savedForLaterItemsAtom);
  return items.length;
});

// Derived: Item total at selling price (instant 0ms responsive calculation)
export const cartItemTotalAtom = atom((get) => {
  const items = get(cartItemsAtom);
  return items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
});

// Derived: Item total at MRP
export const cartMrpTotalAtom = atom((get) => {
  const items = get(cartItemsAtom);
  return items.reduce((sum, item) => sum + Number(item.mrp || item.price || 0) * item.quantity, 0);
});

// Derived: Total product savings
export const cartSavingsAtom = atom((get) => {
  const mrpTotal = get(cartMrpTotalAtom);
  const itemTotal = get(cartItemTotalAtom);
  return Math.max(0, mrpTotal - itemTotal);
});

// Derived: Comprehensive bill breakdown
export const billBreakdownAtom = atom<BillBreakdown>((get) => {
  const server = get(serverCartSummaryAtom);
  const itemTotal = get(cartItemTotalAtom);
  const mrpTotal = get(cartMrpTotalAtom);
  const productDiscount = get(cartSavingsAtom);
  const coupon = get(appliedCouponAtom);
  const activeCoupons = get(activeCouponsAtom);
  const estimatedShipping = get(estimatedShippingFeeAtom);
  const pincode = get(deliveryPincodeAtom);

  const freeDeliveryThreshold = server?.free_shipping_threshold ?? SITE_CONFIG.freeDeliveryThreshold;
  const isFreeDelivery = itemTotal >= freeDeliveryThreshold || itemTotal === 0;

  // Determine delivery fee
  let deliveryFee = 0;
  if (estimatedShipping !== null) {
    deliveryFee = isFreeDelivery ? 0 : estimatedShipping;
  } else {
    deliveryFee = isFreeDelivery ? 0 : SITE_CONFIG.defaultDeliveryFee;
  }

  const handlingFee = itemTotal > 0 ? SITE_CONFIG.handlingFee : 0;
  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - itemTotal);

  // Strict Coupon validation against minimum order value
  let couponDiscount = 0;
  let activeCouponCode: string | null = null;
  const rawCode = coupon?.code || server?.coupon_code || null;

  if (rawCode) {
    const matchedRecord = activeCoupons.find(
      (c) => c.code.toUpperCase() === rawCode.toUpperCase()
    );
    const minRequired =
      coupon?.minCartAmount ??
      (matchedRecord ? Number(matchedRecord.min_cart_amount || 0) : 0);

    // Only apply discount if itemTotal satisfies minimum order criteria
    if (minRequired <= 0 || itemTotal >= minRequired) {
      activeCouponCode = rawCode;
      if (coupon) {
        couponDiscount = coupon.discount;
      } else if (server && typeof server.discount_total !== "undefined" && Number(server.discount_total) > 0) {
        couponDiscount = Number(server.discount_total);
      }
    } else {
      // Ineligible! Cart total does not meet criteria
      couponDiscount = 0;
      activeCouponCode = null;
    }
  }

  const discountTotal = productDiscount + couponDiscount;
  // Always compute grandTotal consistently from line items so the breakdown math is 100% transparent and instant
  const grandTotal = Math.max(
    0,
    itemTotal + deliveryFee + handlingFee - couponDiscount
  );

  return {
    itemTotal,
    subtotal: itemTotal,
    mrpTotal,
    discountTotal,
    deliveryFee,
    shippingTotal: deliveryFee,
    handlingFee,
    taxTotal: server?.tax_total ? Number(server.tax_total) : 0,
    tipAmount: 0,
    couponDiscount,
    couponCode: activeCouponCode,
    grandTotal,
    freeDeliveryThreshold,
    amountNeededForFreeDelivery,
    deliveryPincode: server?.delivery_pincode || pincode || null,
  };
});
