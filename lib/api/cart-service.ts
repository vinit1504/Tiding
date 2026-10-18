import { apiClient } from "./api-client";
import { API_ENDPOINTS } from "@/lib/constants/api-endpoints";
import { SITE_CONFIG } from "@/lib/constants/site-config";
import {
  CartItem,
  BackendCartItem,
  CartSummaryResponse,
  AddItemToCartPayload,
  UpdateCartItemQuantityPayload,
  EstimateShippingPayload,
  MergeGuestCartPayload,
  ApplyCouponPayload,
  CheckoutValidationResult,
  BillBreakdown,
} from "@/types/cart";

const GUEST_SESSION_KEY = "tiding_guest_session_id";

export function getOrCreateGuestSessionId(): string {
  if (typeof window === "undefined") return "guest_ssr_session";
  try {
    let sessionId = localStorage.getItem(GUEST_SESSION_KEY);
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(GUEST_SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return `guest_fallback_${Date.now()}`;
  }
}

export function normalizeBackendCartItem(item: BackendCartItem): CartItem {
  const price = typeof item.current_selling_price !== "undefined"
    ? Number(item.current_selling_price)
    : Number(item.unit_price || 0);

  const mrp = Number(item.unit_price) > price ? Number(item.unit_price) : Math.round(price * 1.15);

  return {
    id: item.id || item.variant_id || item.product_id,
    cartItemId: item.id,
    productId: item.product_id,
    variantId: item.variant_id,
    name: item.product_name || item.variant_name || "Item",
    slug: item.product_slug || `product-${item.product_id}`,
    image_url:
      item.thumbnail_url ||
      "https://res.cloudinary.com/dktxfhq00/image/upload/v1790058895/tiding/avatars/xub5yhdvvd46adh8uoiv.png",
    unit: item.variant_name || "1 unit",
    price,
    mrp,
    quantity: Number(item.quantity || 1),
    maxStock: typeof item.available_stock === "number" ? item.available_stock : 20,
    customAttributes: item.custom_attributes,
    isSavedForLater: !!item.is_saved_for_later,
  };
}

export function parseCartSummaryToBreakdown(
  summary: CartSummaryResponse,
  handlingFee: number = SITE_CONFIG.handlingFee
): BillBreakdown {
  const itemTotal = Number(summary.subtotal || 0);
  const deliveryFee = Number(summary.shipping_total || 0);
  const couponDiscount = Number(summary.discount_total || 0);
  const freeThreshold = summary.free_shipping_threshold || SITE_CONFIG.freeDeliveryThreshold;
  const amountNeeded = Math.max(
    0,
    typeof summary.amount_needed_for_free_shipping === "number"
      ? summary.amount_needed_for_free_shipping
      : freeThreshold - itemTotal
  );

  let mrpTotal = 0;
  if (Array.isArray(summary.active_items)) {
    mrpTotal = summary.active_items.reduce((acc, it) => {
      const price = Number(it.current_selling_price ?? it.unit_price);
      const estMrp = Math.max(price, Number(it.unit_price));
      return acc + estMrp * Number(it.quantity);
    }, 0);
  }
  if (mrpTotal < itemTotal) mrpTotal = itemTotal;

  const discountTotal = Math.max(0, mrpTotal - itemTotal + couponDiscount);
  const grandTotal = Number(summary.grand_total) || itemTotal + deliveryFee + (itemTotal > 0 ? handlingFee : 0) - couponDiscount;

  return {
    itemTotal,
    mrpTotal,
    discountTotal,
    deliveryFee,
    handlingFee: itemTotal > 0 ? handlingFee : 0,
    tipAmount: 0,
    couponDiscount,
    couponCode: summary.coupon_code || null,
    grandTotal: Math.max(0, grandTotal),
    freeDeliveryThreshold: freeThreshold,
    amountNeededForFreeDelivery: amountNeeded,
    deliveryPincode: summary.delivery_pincode || null,
  };
}

export class CartService {
  /**
   * 1. GET /api/v1/cart/my
   * Fetch or auto-create customer active cart with financial breakdown and free shipping threshold progress.
   */
  async getMyCart(): Promise<CartSummaryResponse> {
    return apiClient.get<CartSummaryResponse>(API_ENDPOINTS.CART.MY);
  }

  /**
   * 2. POST /api/v1/cart/items
   * Adds SKU variant to active cart or increments quantity.
   */
  async addItem(payload: AddItemToCartPayload): Promise<CartSummaryResponse> {
    return apiClient.post<CartSummaryResponse, AddItemToCartPayload>(
      API_ENDPOINTS.CART.ITEMS,
      payload
    );
  }

  /**
   * 3. PATCH /api/v1/cart/items/:cartItemId
   * Updates quantity for a specific cart line item.
   */
  async updateItemQuantity(
    cartItemId: string,
    quantity: number
  ): Promise<CartSummaryResponse> {
    return apiClient.patch<CartSummaryResponse, UpdateCartItemQuantityPayload>(
      API_ENDPOINTS.CART.ITEM(cartItemId),
      { quantity }
    );
  }

  /**
   * 4. POST /api/v1/cart/items/:cartItemId/save-for-later
   * Moves item out of active checkout calculation into saved-for-later list.
   */
  async saveForLater(cartItemId: string): Promise<CartSummaryResponse> {
    return apiClient.post<CartSummaryResponse, Record<string, never>>(
      API_ENDPOINTS.CART.SAVE_FOR_LATER(cartItemId),
      {}
    );
  }

  /**
   * 5. POST /api/v1/cart/items/:cartItemId/move-to-cart
   * Moves item from saved-for-later list back into active checkout items.
   */
  async moveToCart(cartItemId: string): Promise<CartSummaryResponse> {
    return apiClient.post<CartSummaryResponse, Record<string, never>>(
      API_ENDPOINTS.CART.MOVE_TO_CART(cartItemId),
      {}
    );
  }

  /**
   * 6. POST /api/v1/cart/validate-checkout
   * Pre-flight verification checking for out-of-stock items and price fluctuations before order placement.
   */
  async validateCheckout(): Promise<CheckoutValidationResult> {
    return apiClient.post<CheckoutValidationResult, Record<string, never>>(
      API_ENDPOINTS.CART.VALIDATE_CHECKOUT,
      {}
    );
  }

  /**
   * 7. POST /api/v1/cart/estimate-shipping
   * Calculates delivery shipping charges and delivery threshold based on customer pincode.
   */
  async estimateShipping(deliveryPincode: string): Promise<CartSummaryResponse> {
    return apiClient.post<CartSummaryResponse, EstimateShippingPayload>(
      API_ENDPOINTS.CART.ESTIMATE_SHIPPING,
      { deliveryPincode }
    );
  }

  /**
   * 8. DELETE /api/v1/cart/items/:cartItemId
   * Removes an item from the cart.
   */
  async removeItem(cartItemId: string): Promise<CartSummaryResponse> {
    return apiClient.delete<CartSummaryResponse>(API_ENDPOINTS.CART.ITEM(cartItemId));
  }

  /**
   * 9. POST /api/v1/cart/clear
   * Empties all active checkout items from the cart.
   */
  async clearCart(): Promise<CartSummaryResponse> {
    return apiClient.post<CartSummaryResponse, Record<string, never>>(
      API_ENDPOINTS.CART.CLEAR,
      {}
    );
  }

  /**
   * 10. POST /api/v1/cart/merge
   * Merges anonymous guest session cart into user account upon sign-in.
   */
  async mergeGuestCart(guestSessionId?: string): Promise<CartSummaryResponse> {
    const sessionId = guestSessionId || getOrCreateGuestSessionId();
    return apiClient.post<CartSummaryResponse, MergeGuestCartPayload>(
      API_ENDPOINTS.CART.MERGE,
      { guestSessionId: sessionId }
    );
  }

  /**
   * 11. POST /api/v1/cart/apply-coupon
   * Applies promotional discount coupon and recalculates grand total.
   */
  async applyCoupon(couponCode: string): Promise<CartSummaryResponse> {
    return apiClient.post<CartSummaryResponse, ApplyCouponPayload>(
      API_ENDPOINTS.CART.APPLY_COUPON,
      { couponCode: couponCode.trim().toUpperCase() }
    );
  }

  /**
   * 12. POST /api/v1/cart/remove-coupon
   * Removes applied coupon code and restores standard grand total.
   */
  async removeCoupon(): Promise<CartSummaryResponse> {
    return apiClient.post<CartSummaryResponse, Record<string, never>>(
      API_ENDPOINTS.CART.REMOVE_COUPON,
      {}
    );
  }
}

export const cartService = new CartService();
