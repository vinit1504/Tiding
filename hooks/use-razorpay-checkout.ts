"use client";

import { useState } from "react";
import { checkoutApi } from "@/lib/api/checkout-api";
import { loadRazorpayScript } from "@/lib/utils/razorpay";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface RazorpayCustomerDetails {
  name: string;
  email: string;
  phone: string;
}

export const useRazorpayCheckout = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const payWithRazorpay = async ({
    checkout,
    customer,
    onSuccess,
    onError,
  }: {
    checkout: {
      id: string;
      checkout_code?: string;
      grand_total?: number;
      [key: string]: any;
    };
    customer: RazorpayCustomerDetails;
    onSuccess: (order: any) => void;
    onError: (errorMessage: string) => void;
  }) => {
    setIsProcessing(true);

    try {
      // 0. Ensure Razorpay SDK script is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || typeof window === "undefined" || !window.Razorpay) {
        throw new Error("Unable to load Razorpay payment gateway script. Please check your network connection.");
      }

      // 1. Create Payment Intent
      const intentRes = await checkoutApi.createPaymentIntent(checkout.id, "RAZORPAY");

      const razorpayData = intentRes?.razorpay || intentRes?.data?.razorpay || intentRes;
      if (!razorpayData || !razorpayData.orderId) {
        throw new Error(
          intentRes?.message ||
            intentRes?.error?.message ||
            "Razorpay gateway order details not returned from server."
        );
      }

      const { orderId, amount, currency, keyId } = razorpayData;

      // 2. Configure Razorpay modal
      // WARNING: 'amount' is ALREADY in paise (e.g., ₹450 = 45000). DO NOT multiply by 100!
      const options = {
        key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TpHhyPog3vhCbr",
        amount: Number(amount),
        currency: currency || "INR",
        name: "Tiding Store",
        description: `Order Payment for ${checkout.checkout_code || checkout.id}`,
        order_id: orderId,
        prefill: {
          name: customer.name || "Customer",
          email: customer.email || "customer@tiding.in",
          contact: customer.phone || "9876543210",
        },
        theme: {
          color: "#059669", // Emerald 600
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            // 3. Cryptographic Signature Verification
            await checkoutApi.verifyPayment(checkout.id, {
              paymentId: response.razorpay_payment_id,
              paymentOrderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });

            // 4. Finalize Checkout & Increment Coupon Usage
            const finalized = await checkoutApi.complete(checkout.id, {
              paymentMethod: "RAZORPAY",
              paymentId: response.razorpay_payment_id,
            });

            setIsProcessing(false);
            const finalOrder = finalized?.order || finalized?.data?.order || finalized;
            onSuccess(finalOrder);
          } catch (verifyErr: any) {
            setIsProcessing(false);
            onError(
              verifyErr?.response?.data?.message ||
                verifyErr?.message ||
                "Payment verification failed."
            );
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            onError("Payment was cancelled by the user.");
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    } catch (err: any) {
      setIsProcessing(false);
      onError(
        err?.response?.data?.message || err?.message || "Failed to initialize payment."
      );
    }
  };

  return { payWithRazorpay, isProcessing };
};
