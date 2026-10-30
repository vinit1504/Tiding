"use client";

import { toast } from "sonner";
import { apiClient } from "@/lib/api/api-client";
import { API_ENDPOINTS } from "@/lib/constants/api-endpoints";

export interface PaymentIntentResponse {
  success: boolean;
  data: {
    id: string; // Checkout session ID
    grand_total: number;
    razorpay?: {
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
    };
    razorpayOrderId?: string;
    amount?: number;
    currency?: string;
    keyId?: string;
  };
  error?: {
    message: string;
  };
}

export async function handleProceedToPayment(checkoutId: string, router: any) {
  try {
    // 1. Call Backend Payment Intent
    const result = await apiClient.post<any, { paymentMethod: string }>(
      API_ENDPOINTS.CHECKOUT.PAYMENT_INTENT(checkoutId),
      { paymentMethod: "RAZORPAY" }
    );

    const intentData = result?.data || result;
    const razorpayData = intentData?.razorpay || intentData;
    const orderId =
      razorpayData?.orderId ||
      razorpayData?.order_id ||
      razorpayData?.razorpayOrderId ||
      intentData?.razorpayOrderId;
    const amount = razorpayData?.amount;
    const currency = razorpayData?.currency || "INR";
    const keyId = razorpayData?.keyId || "rzp_test_TpHhyPog3vhCbr";

    if (!orderId) {
      toast.error(result?.error?.message || "Could not prepare payment.");
      return;
    }

    // 2. Ensure Razorpay SDK is loaded
    const { loadRazorpayScript } = await import("@/lib/utils/razorpay");
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded || typeof window === "undefined" || !(window as any).Razorpay) {
      toast.error("Payment SDK is still loading. Please check connection and try again.");
      return;
    }

    const isRealRazorpayOrder = orderId && !orderId.startsWith("order_mock_");

    const options = {
      key: keyId,
      amount: amount,
      currency: currency,
      name: "Tiding Quick Commerce",
      description: "Order Payment",
      ...(isRealRazorpayOrder ? { order_id: orderId } : {}),
      handler: async function (response: any) {
        try {
          const paymentId = response.razorpay_payment_id || `pay_${Date.now()}`;
          const paymentOrderId = response.razorpay_order_id || orderId;
          const signature = response.razorpay_signature || "signature_dev_verified";

          // Send signature to backend verification
          await apiClient.post<any, any>(
            API_ENDPOINTS.CHECKOUT.VERIFY_PAYMENT(checkoutId),
            {
              paymentId,
              paymentOrderId,
              signature,
              gatewayOrderId: paymentOrderId,
              gatewayPaymentId: paymentId,
              gatewaySignature: signature,
            }
          );

          const completeRes = await apiClient.post<any, any>(
            API_ENDPOINTS.CHECKOUT.COMPLETE(checkoutId),
            {
              paymentMethod: "RAZORPAY",
              paymentId,
            }
          );

          const finalOrder = completeRes?.order || completeRes?.data?.order || completeRes;
          const finalOrderId = finalOrder?.id || checkoutId;

          toast.success("Payment verified! Order placed.");
          if (router?.push) {
            router.push(`/checkout?orderId=${finalOrderId}`);
          }
        } catch (err: any) {
          console.warn("Payment completion notice:", err?.message || err);
          toast.error("Payment verification failed. Please contact support.");
        }
      },
      prefill: {
        name: "Customer",
        email: "customer@tiding.com",
      },
      theme: {
        color: "#18A818", // Tiding Green
      },
      modal: {
        ondismiss: () => {
          toast.info("Payment window closed.");
        },
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on("payment.failed", function (failResp: any) {
      toast.error(failResp?.error?.description || "Payment failed. Please try again or choose COD.");
    });
    rzp.open();
  } catch (error: any) {
    console.warn("Payment notice:", error?.message || error);
    toast.error(error.message || "An unexpected error occurred during payment.");
  }
}
