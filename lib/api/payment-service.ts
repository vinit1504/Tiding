import { apiClient } from "./api-client";
import { API_ENDPOINTS } from "@/lib/constants/api-endpoints";
import {
  PaymentIntentPayload,
  PaymentIntentData,
  PaymentVerifyPayload,
  PaymentVerifyResponse,
} from "@/types/payment";

export class PaymentService {
  /**
   * 1. POST /api/v1/payments/intent
   * Generates Razorpay Order and payment intent
   */
  async createPaymentIntent(payload: PaymentIntentPayload): Promise<PaymentIntentData> {
    const response = await apiClient.post<{ data: PaymentIntentData; success: boolean } | PaymentIntentData, PaymentIntentPayload>(
      API_ENDPOINTS.PAYMENTS.INTENT,
      payload
    );
    // Unpack data if nested
    if (response && "data" in response && (response as any).data) {
      return (response as any).data;
    }
    return response as PaymentIntentData;
  }

  /**
   * 2. POST /api/v1/payments/verify
   * Verifies Razorpay HMAC-SHA256 signature and settles payment
   */
  async verifyPayment(payload: PaymentVerifyPayload): Promise<PaymentVerifyResponse> {
    return apiClient.post<PaymentVerifyResponse, PaymentVerifyPayload>(
      API_ENDPOINTS.PAYMENTS.VERIFY,
      payload
    );
  }

  /**
   * 3. POST /api/v1/checkout/:id/payment-intent
   * Alternative checkout session payment intent
   */
  async createCheckoutPaymentIntent(
    checkoutId: string,
    paymentMethod: string = "RAZORPAY"
  ): Promise<PaymentIntentData> {
    const response = await apiClient.post<{ data: PaymentIntentData } | PaymentIntentData, { paymentMethod: string }>(
      API_ENDPOINTS.CHECKOUT.PAYMENT_INTENT(checkoutId),
      { paymentMethod }
    );
    if (response && "data" in response && (response as any).data) {
      return (response as any).data;
    }
    return response as PaymentIntentData;
  }

  /**
   * 4. POST /api/v1/checkout/:id/verify-payment
   * Alternative checkout session payment verification
   */
  async verifyCheckoutPayment(
    checkoutId: string,
    payload: PaymentVerifyPayload
  ): Promise<PaymentVerifyResponse> {
    return apiClient.post<PaymentVerifyResponse, PaymentVerifyPayload>(
      API_ENDPOINTS.CHECKOUT.VERIFY_PAYMENT(checkoutId),
      payload
    );
  }

  /**
   * 5. GET /api/v1/payments
   * List customer payment history
   */
  async getMyPayments(): Promise<any[]> {
    return apiClient.get<any[]>(API_ENDPOINTS.PAYMENTS.LIST, []);
  }

  /**
   * 6. GET /api/v1/payments/:id
   * Get payment receipt by ID
   */
  async getPaymentDetail(paymentId: string): Promise<any> {
    return apiClient.get<any>(API_ENDPOINTS.PAYMENTS.DETAIL(paymentId));
  }
}

export const paymentService = new PaymentService();
