export interface CartItemCustomAttributes {
  color?: string;
  size?: string;
  weight?: string;
  [key: string]: unknown;
}

export interface CartItem {
  id: string; // SKU variant ID, Product ID, or Line Item ID
  cartItemId?: string; // Specific backend database line item UUID
  productId: string;
  variantId?: string;
  name: string;
  slug: string;
  image_url: string;
  unit: string;
  price: number;
  mrp: number;
  quantity: number;
  maxStock: number;
  customAttributes?: CartItemCustomAttributes;
  isSavedForLater?: boolean;
}

export interface BackendCartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number | string;
  total_price: number | string;
  is_saved_for_later: boolean;
  custom_attributes?: CartItemCustomAttributes;
  product_name?: string;
  product_slug?: string;
  variant_name?: string;
  sku?: string;
  thumbnail_url?: string | null;
  current_selling_price?: number | string;
  available_stock?: number;
}

export interface CartSummaryResponse {
  id: string;
  customer_id: string | null;
  session_id: string | null;
  status: string;
  currency: string;
  subtotal: number | string;
  shipping_total: number | string;
  handling_fee?: number | string;
  tax_total: number | string;
  discount_total: number | string;
  grand_total: number | string;
  coupon_code: string | null;
  delivery_pincode: string | null;
  notes?: string | null;
  active_items: BackendCartItem[];
  saved_for_later_items: BackendCartItem[];
  items_count: number;
  free_shipping_threshold: number;
  free_shipping_eligible: boolean;
  amount_needed_for_free_shipping: number;
}

export interface BillBreakdown {
  itemTotal: number;
  subtotal?: number;
  mrpTotal: number;
  discountTotal: number;
  deliveryFee: number;
  shippingTotal?: number;
  handlingFee: number;
  taxTotal?: number;
  tipAmount: number;
  couponDiscount: number;
  couponCode?: string | null;
  grandTotal: number;
  freeDeliveryThreshold: number;
  amountNeededForFreeDelivery: number;
  deliveryPincode?: string | null;
}

export interface AddItemToCartPayload {
  variantId: string;
  quantity: number;
  customAttributes?: CartItemCustomAttributes;
}

export interface UpdateCartItemQuantityPayload {
  quantity: number;
}

export interface EstimateShippingPayload {
  deliveryPincode: string;
}

export interface MergeGuestCartPayload {
  guestSessionId: string;
}

export interface ApplyCouponPayload {
  couponCode: string;
}

export interface CheckoutValidationWarning {
  itemId: string;
  variantId: string;
  productName: string;
  type: "PRICE_CHANGED" | "INSUFFICIENT_STOCK" | "ITEM_UNAVAILABLE";
  message: string;
  oldPrice?: number;
  newPrice?: number;
  requestedQuantity?: number;
  availableStock?: number;
}

export interface CheckoutValidationResult {
  isCheckoutReady: boolean;
  warnings: CheckoutValidationWarning[];
}
