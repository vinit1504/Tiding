import { apiClient } from "@/lib/api/api-client";
import { API_ENDPOINTS } from "@/lib/constants/api-endpoints";

/**
 * Standard Customer-Side Checkout API Service
 * Strictly implements the 8-step checkout lifecycle contract.
 */
export const checkoutApi = {
  // Step 1: Initialize checkout session from cart
  initiate: async (storeId?: string) => {
    const res = await apiClient.post<any, { storeId?: string }>(
      API_ENDPOINTS.CHECKOUT.INITIATE,
      storeId ? { storeId } : {}
    );
    return res && "data" in res && (res as any).data !== undefined ? (res as any).data : res;
  },

  // Step 2: Select shipping and optional billing address
  selectAddress: async (
    checkoutId: string,
    shippingAddressId: string,
    billingAddressId?: string
  ) => {
    const res = await apiClient.post<any, any>(
      API_ENDPOINTS.CHECKOUT.ADDRESS(checkoutId),
      {
        shippingAddressId,
        billingAddressId,
        sameAsShipping: !billingAddressId,
      }
    );
    return res && "data" in res && (res as any).data !== undefined ? (res as any).data : res;
  },

  // Step 3: Select delivery option
  selectDeliveryOption: async (
    checkoutId: string,
    deliveryMethod: "STANDARD" | "EXPRESS" = "EXPRESS",
    deliverySlot?: string
  ) => {
    const res = await apiClient.post<any, any>(
      API_ENDPOINTS.CHECKOUT.DELIVERY_OPTION(checkoutId),
      {
        deliveryMethod,
        deliverySlot,
      }
    );
    return res && "data" in res && (res as any).data !== undefined ? (res as any).data : res;
  },

  // Step 4: Apply coupon directly in checkout
  applyCoupon: async (checkoutId: string, code: string) => {
    const res = await apiClient.post<any, any>(
      API_ENDPOINTS.CHECKOUT.COUPON(checkoutId),
      { code: code.trim().toUpperCase() }
    );
    return res && "data" in res && (res as any).data !== undefined ? (res as any).data : res;
  },

  // Step 5: Remove coupon from checkout
  removeCoupon: async (checkoutId: string) => {
    const res = await apiClient.delete<any>(
      API_ENDPOINTS.CHECKOUT.COUPON(checkoutId)
    );
    return res && "data" in res && (res as any).data !== undefined ? (res as any).data : res;
  },

  // Step 6: Create Payment Intent for Razorpay
  createPaymentIntent: async (
    checkoutId: string,
    paymentMethod: "RAZORPAY" | "COD" = "RAZORPAY"
  ) => {
    const res = await apiClient.post<any, any>(
      API_ENDPOINTS.CHECKOUT.PAYMENT_INTENT(checkoutId),
      { paymentMethod }
    );
    return res && "data" in res && (res as any).data !== undefined ? (res as any).data : res;
  },

  // Step 7: Verify Razorpay HMAC signature
  verifyPayment: async (
    checkoutId: string,
    payload: {
      paymentId: string;
      paymentOrderId: string;
      signature: string;
      gatewayOrderId?: string;
      gatewayPaymentId?: string;
      gatewaySignature?: string;
    }
  ) => {
    const res = await apiClient.post<any, any>(
      API_ENDPOINTS.CHECKOUT.VERIFY_PAYMENT(checkoutId),
      {
        ...payload,
        gatewayOrderId: payload.gatewayOrderId || payload.paymentOrderId,
        gatewayPaymentId: payload.gatewayPaymentId || payload.paymentId,
        gatewaySignature: payload.gatewaySignature || payload.signature,
      }
    );
    return res && "data" in res && (res as any).data !== undefined ? (res as any).data : res;
  },

  // Step 8: Complete checkout & generate Order (Increments coupon redemption count)
  complete: async (
    checkoutId: string,
    payload: { paymentMethod: string; paymentId?: string; notes?: string }
  ) => {
    const res = await apiClient.post<any, any>(
      API_ENDPOINTS.CHECKOUT.COMPLETE(checkoutId),
      payload
    );
    return res && "data" in res && (res as any).data !== undefined ? (res as any).data : res;
  },
};

