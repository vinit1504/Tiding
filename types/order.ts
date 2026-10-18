import { CartItem } from "./cart";
import { DeliveryLocation } from "./location";
import { OrderAddressPayload } from "./payment";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "placed"
  | "confirmed"
  | "packing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "pending" | "paid" | "failed";

export interface BackendOrderItem {
  id?: string;
  productId?: string;
  product_id?: string;
  variantId?: string;
  variant_id?: string;
  productName?: string;
  product_name?: string;
  name?: string;
  variantSku?: string;
  variant_sku?: string;
  quantity: number;
  qty?: number;
  unitPrice?: number | string;
  unit_price?: number | string;
  price?: number;
  totalPrice?: number | string;
  total_price?: number | string;
  taxAmount?: number | string;
  tax_amount?: number | string;
  discountAmount?: number | string;
  discount_amount?: number | string;
  imageUrl?: string;
  image_url?: string;
  image?: string;
  thumbnail_url?: string | null;
  unit?: string;
}

export interface BackendOrder {
  id: string;
  orderNumber?: string;
  order_number?: string;
  storeId?: string;
  store_id?: string;
  customerId?: string;
  customer_id?: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  payment_status?: PaymentStatus;
  paymentMethod?: string;
  payment_method?: string;
  currency?: string;
  subtotal: number | string;
  discountTotal?: number | string;
  discount_total?: number | string;
  shippingTotal?: number | string;
  shipping_total?: number | string;
  taxTotal?: number | string;
  tax_total?: number | string;
  grandTotal?: number | string;
  grand_total?: number | string;
  totalAmount?: number | string;
  total_amount?: number | string;
  deliveryMethod?: string;
  delivery_method?: string;
  trackingNumber?: string;
  tracking_number?: string;
  notes?: string | null;
  shippingAddress?: OrderAddressPayload | any;
  shipping_address?: OrderAddressPayload | any;
  billingAddress?: OrderAddressPayload | any;
  billing_address?: OrderAddressPayload | any;
  items: BackendOrderItem[];
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  deliveredAt?: string;
  delivered_at?: string;
}

export interface OrderTrackingStep {
  status: OrderStatus;
  title: string;
  description: string;
  timestamp?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  savingsAmount: number;
  status: OrderStatus;
  paymentMethod: "cod" | "upi" | "card" | string;
  paymentStatus: "pending" | "paid" | "failed" | string;
  createdAt: string;
  deliveredAt?: string;
  deliveryLocation?: DeliveryLocation;
  deliveryPartner?: {
    name: string;
    phone: string;
    photo?: string;
    vehicleNumber?: string;
  };
  trackingSteps?: OrderTrackingStep[];
}

