import { apiClient } from "./api-client";
import { API_ENDPOINTS } from "@/lib/constants/api-endpoints";
import {
  CheckoutWithItems,
  InitiateCheckoutDto,
  SelectAddressDto,
  SelectDeliveryDto,
  ApplyCheckoutCouponDto,
  CreatePaymentIntentDto,
  VerifyPaymentDto,
  CompleteCheckoutDto,
  OrderWithItems,
} from "@/types/checkout";

export class CheckoutService {
  /**
   * 1. POST /api/v1/checkout
   * Initiates checkout from active cart, freezes prices, and RESERVES STOCK in warehouse.
   */
  async initiateCheckout(dto: InitiateCheckoutDto = {}): Promise<CheckoutWithItems> {
    const res = await apiClient.post<CheckoutWithItems | { data: CheckoutWithItems }, InitiateCheckoutDto>(
      API_ENDPOINTS.CHECKOUT.INITIATE,
      dto
    );
    if (res && "data" in res && (res as any).data) {
      return (res as any).data;
    }
    return res as CheckoutWithItems;
  }

  /**
   * 2. GET /api/v1/checkout/active
   * Retrieves active, unexpired checkout session for customer.
   */
  async getActiveCheckout(): Promise<CheckoutWithItems | null> {
    try {
      const res = await apiClient.get<CheckoutWithItems | { data: CheckoutWithItems }>(
        API_ENDPOINTS.CHECKOUT.ACTIVE
      );
      if (res && "data" in res && (res as any).data) {
        return (res as any).data;
      }
      return (res as CheckoutWithItems) || null;
    } catch {
      return null;
    }
  }

  /**
   * 3. GET /api/v1/checkout/:id
   * Retrieve single checkout session detail.
   */
  async getCheckoutById(checkoutId: string): Promise<CheckoutWithItems> {
    const res = await apiClient.get<CheckoutWithItems | { data: CheckoutWithItems }>(
      API_ENDPOINTS.CHECKOUT.DETAIL(checkoutId)
    );
    if (res && "data" in res && (res as any).data) {
      return (res as any).data;
    }
    return res as CheckoutWithItems;
  }

  /**
   * 4. POST /api/v1/checkout/:id/address
   * Attaches selected shipping and billing addresses to checkout session.
   */
  async selectAddress(checkoutId: string, dto: SelectAddressDto): Promise<CheckoutWithItems> {
    const res = await apiClient.post<CheckoutWithItems | { data: CheckoutWithItems }, SelectAddressDto>(
      API_ENDPOINTS.CHECKOUT.ADDRESS(checkoutId),
      dto
    );
    if (res && "data" in res && (res as any).data) {
      return (res as any).data;
    }
    return res as CheckoutWithItems;
  }

  /**
   * 5. POST /api/v1/checkout/:id/delivery-option
   * Selects delivery method (STANDARD, EXPRESS, or SLOT).
   */
  async selectDeliveryOption(
    checkoutId: string,
    dto: SelectDeliveryDto
  ): Promise<CheckoutWithItems> {
    const res = await apiClient.post<CheckoutWithItems | { data: CheckoutWithItems }, SelectDeliveryDto>(
      API_ENDPOINTS.CHECKOUT.DELIVERY_OPTION(checkoutId),
      dto
    );
    if (res && "data" in res && (res as any).data) {
      return (res as any).data;
    }
    return res as CheckoutWithItems;
  }

  /**
   * 6. POST /api/v1/checkout/:id/coupon
   * Applies promotional discount coupon to checkout session.
   */
  async applyCoupon(checkoutId: string, code: string): Promise<CheckoutWithItems> {
    const res = await apiClient.post<CheckoutWithItems | { data: CheckoutWithItems }, ApplyCheckoutCouponDto>(
      API_ENDPOINTS.CHECKOUT.COUPON(checkoutId),
      { code: code.trim().toUpperCase() }
    );
    if (res && "data" in res && (res as any).data) {
      return (res as any).data;
    }
    return res as CheckoutWithItems;
  }

  /**
   * 7. DELETE /api/v1/checkout/:id/coupon
   * Removes applied coupon from checkout session.
   */
  async removeCoupon(checkoutId: string): Promise<CheckoutWithItems> {
    const res = await apiClient.delete<CheckoutWithItems | { data: CheckoutWithItems }>(
      API_ENDPOINTS.CHECKOUT.COUPON(checkoutId)
    );
    if (res && "data" in res && (res as any).data) {
      return (res as any).data;
    }
    return res as CheckoutWithItems;
  }

  /**
   * 8. POST /api/v1/checkout/:id/payment-intent
   * Generates Razorpay Order payment intent.
   */
  async createPaymentIntent(
    checkoutId: string,
    paymentMethod: "COD" | "RAZORPAY" | "WALLET" = "RAZORPAY"
  ): Promise<any> {
    const res = await apiClient.post<any, CreatePaymentIntentDto>(
      API_ENDPOINTS.CHECKOUT.PAYMENT_INTENT(checkoutId),
      { paymentMethod }
    );
    if (res && "data" in res && (res as any).data) {
      return (res as any).data;
    }
    return res;
  }

  /**
   * 9. POST /api/v1/checkout/:id/verify-payment
   * Cryptographically verifies Razorpay payment signature.
   */
  async verifyPayment(checkoutId: string, dto: VerifyPaymentDto): Promise<any> {
    return apiClient.post<any, VerifyPaymentDto>(
      API_ENDPOINTS.CHECKOUT.VERIFY_PAYMENT(checkoutId),
      dto
    );
  }

  /**
   * 10. POST /api/v1/checkout/:id/complete
   * Atomically transitions checkout to COMPLETED, COMMITS INVENTORY (100 -> 99),
   * creates Order records, and closes cart.
   */
  async completeCheckout(
    checkoutId: string,
    dto: CompleteCheckoutDto = {}
  ): Promise<OrderWithItems> {
    const res = await apiClient.post<OrderWithItems | { data: OrderWithItems }, CompleteCheckoutDto>(
      API_ENDPOINTS.CHECKOUT.COMPLETE(checkoutId),
      dto
    );
    if (res && "data" in res && (res as any).data) {
      return (res as any).data;
    }
    return res as OrderWithItems;
  }

  /**
   * 11. POST /api/v1/checkout/:id/cancel
   * Cancels checkout session and releases inventory holds back to store.
   */
  async cancelCheckout(checkoutId: string): Promise<{ success: boolean; message?: string }> {
    return apiClient.post<{ success: boolean; message?: string }, Record<string, never>>(
      API_ENDPOINTS.CHECKOUT.CANCEL(checkoutId),
      {}
    );
  }
}

export const checkoutService = new CheckoutService();
