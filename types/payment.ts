export type PaymentGateway = "RAZORPAY" | "COD" | "WALLET";

export type PaymentMethodType = "UPI" | "CARD" | "NETBANKING" | "WALLET" | "COD";

export interface PaymentIntentPayload {
  orderId: string;
  paymentMethod: string;
  gateway?: PaymentGateway;
}

export interface PaymentIntentData {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  orderId?: string;
}

export interface PaymentIntentResponse {
  success: boolean;
  statusCode: number;
  message?: string;
  data: PaymentIntentData;
}

export interface PaymentVerifyPayload {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaymentVerifyResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: any;
}

export interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => void | Promise<void>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
    backdrop_color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

export interface OrderAddressPayload {
  fullName?: string;
  receiverName?: string;
  phone?: string;
  receiverPhone?: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine?: string;
  landmark?: string;
  area?: string;
  city: string;
  state: string;
  pincode: string;
  postalCode?: string;
  country?: string;
  addressType?: "HOME" | "WORK" | "OTHER";
  formattedAddress?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface OrderItemPayload {
  productId: string;
  variantId?: string;
  productName: string;
  variantSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxAmount?: number;
  discountAmount?: number;
}

export interface CreateOrderPayload {
  storeId?: string;
  paymentMethod: string;
  currency?: string;
  subtotal: number;
  discountTotal?: number;
  shippingTotal?: number;
  taxTotal?: number;
  grandTotal: number;
  deliveryMethod?: string;
  notes?: string;
  shippingAddress: OrderAddressPayload;
  billingAddress: OrderAddressPayload;
  items: OrderItemPayload[];
  // Fallback aliases for backward compatibility
  shippingFee?: number;
  deliveryFee?: number;
  handlingFee?: number;
  couponDiscount?: number;
  couponCode?: string | null;
  deliveryInstruction?: string;
  deliveryPincode?: string;
  deliveryAddress?: OrderAddressPayload;
}

export interface CreateOrderResponse {
  id: string;
  orderNumber?: string;
  order_number?: string;
  total_amount?: number;
  grandTotal?: number;
  status: string;
  payment_status?: string;
  created_at?: string;
  createdAt?: string;
}

