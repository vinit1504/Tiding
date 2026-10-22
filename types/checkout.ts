export type CheckoutStatus =
  | "INITIATED"
  | "ADDRESS_SELECTED"
  | "DELIVERY_SELECTED"
  | "PAYMENT_PENDING"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED";

export type DeliveryMethod = "STANDARD" | "EXPRESS" | "SLOT";

export type CheckoutPaymentMethod = "COD" | "RAZORPAY" | "WALLET";

export interface AddressSnapshot {
  id?: string;
  user_id?: string;
  recipient_name: string;
  recipient_phone: string;
  address_line_1: string;
  address_line_2?: string | null;
  landmark?: string | null;
  city_id?: string;
  state_id?: string;
  country_id?: string;
  pincode_id?: string | null;
  address_type?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface CheckoutItemRecord {
  id: string;
  checkout_id: string;
  product_id: string;
  variant_id: string;
  store_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  product_snapshot: {
    product_name: string;
    product_slug?: string;
    sku: string;
    variant_name?: string;
    thumbnail_url?: string | null;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CheckoutRecord {
  id: string;
  checkout_code: string;
  customer_id: string;
  cart_id: string;
  store_id: string | null;
  status: CheckoutStatus;
  currency: string;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  grand_total: number;
  shipping_address_id: string | null;
  billing_address_id: string | null;
  shipping_address_snapshot: AddressSnapshot | null;
  billing_address_snapshot: AddressSnapshot | null;
  delivery_method: DeliveryMethod;
  delivery_slot: string | null;
  estimated_delivery_at: string | null;
  coupon_id: string | null;
  coupon_code: string | null;
  payment_method: CheckoutPaymentMethod | null;
  payment_status: string;
  payment_order_id: string | null;
  idempotency_key: string | null;
  notes: string | null;
  expires_at: string;
  completed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CheckoutWithItems extends CheckoutRecord {
  items: CheckoutItemRecord[];
  razorpay?: {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  };
}

export interface InitiateCheckoutDto {
  notes?: string;
  idempotencyKey?: string;
}

export interface SelectAddressDto {
  shippingAddressId: string;
  billingAddressId?: string;
  sameAsShipping?: boolean;
}

export interface SelectDeliveryDto {
  deliveryMethod: DeliveryMethod;
  deliverySlot?: string;
}

export interface ApplyCheckoutCouponDto {
  code: string;
}

export interface CreatePaymentIntentDto {
  paymentMethod: CheckoutPaymentMethod;
}

export interface VerifyPaymentDto {
  paymentId?: string;
  paymentOrderId?: string;
  signature?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

export interface CompleteCheckoutDto {
  paymentMethod?: CheckoutPaymentMethod;
  paymentId?: string;
  idempotencyKey?: string;
  notes?: string;
}

export interface OrderWithItems {
  order: {
    id: string;
    order_number: string;
    customer_id: string;
    checkout_id: string | null;
    store_id: string | null;
    status: string;
    payment_status: string;
    payment_method: string;
    currency: string;
    subtotal: number;
    discount_total: number;
    shipping_total: number;
    tax_total: number;
    grand_total: number;
    shipping_address: AddressSnapshot;
    billing_address: AddressSnapshot;
    delivery_method: string;
    tracking_number: string | null;
    notes: string | null;
    placed_at: string;
  };
  items: Array<{
    id: string;
    order_id: string;
    product_id: string;
    variant_id: string;
    product_name: string;
    variant_sku: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    tax_amount: number;
    discount_amount: number;
  }>;
}
