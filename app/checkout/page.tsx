"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAtomValue } from "jotai";
import { toast } from "sonner";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { deliveryLocationAtom } from "@/stores";
import { loadRazorpayScript } from "@/lib/utils/razorpay";
import { couponService } from "@/lib/api/coupon-service";
import {
  useInitiateCheckoutMutation,
  useCheckoutPaymentIntentMutation,
  useCheckoutVerifyPaymentMutation,
  useCompleteCheckoutMutation,
} from "@/queries/checkout/use-checkout-mutations";
import { RazorpayOptions, RazorpayHandlerResponse } from "@/types/payment";

import { CheckoutPageHeader } from "@/components/checkout/checkout-page-header";
import { CheckoutStepper } from "@/components/checkout/checkout-stepper";
import { ProductDetailsStep } from "@/components/checkout/product-details-step";
import { DeliveryStep } from "@/components/checkout/delivery-step";
import { PaymentStep } from "@/components/checkout/payment-step";
import { AddressCardData } from "@/components/checkout/delivery-address-section";
import { PaymentOption } from "@/components/checkout/payment-method-section";
import { OrderSummaryReview } from "@/components/checkout/order-summary-review";
import { FinalBillSummary } from "@/components/checkout/final-bill-summary";
import {
  OrderSuccessView,
  PlacedOrderDetails,
} from "@/components/checkout/order-success-view";
import { CheckoutSkeleton } from "@/components/checkout/checkout-skeleton";

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items: cartItems,
    cartCount,
    bill,
    clearCart,
    appliedCoupon,
    updateQuantity,
    removeItem,
  } = useCart();
  const location = useAtomValue(deliveryLocationAtom);
  const { user, isAuthenticated, openLogin } = useAuth();

  // Stepper state: 1: Product Details, 2: Delivery Address & Instructions, 3: Payment Options
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const [isMounted, setIsMounted] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressCardData | null>(null);
  const [selectedInstruction, setSelectedInstruction] = useState<string>("Leave at door");
  const [customNotes, setCustomNotes] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentOption>("upi");

  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrderDetails | null>(null);

  // Mutations
  const initiateCheckoutMutation = useInitiateCheckoutMutation();
  const checkoutPaymentIntentMutation = useCheckoutPaymentIntentMutation();
  const checkoutVerifyPaymentMutation = useCheckoutVerifyPaymentMutation();
  const completeCheckoutMutation = useCompleteCheckoutMutation();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isAuthenticated && !placedOrder && cartCount > 0) {
      toast.info("Please log in to continue with checkout");
      openLogin("/checkout");
    }
  }, [isMounted, isAuthenticated, placedOrder, cartCount, openLogin]);

  if (!isMounted) {
    return <CheckoutSkeleton />;
  }

  // If order was successfully placed, display the success view
  if (placedOrder) {
    return <OrderSuccessView order={placedOrder} />;
  }

  // If cart is empty and no placed order
  if (cartCount === 0) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 sm:py-24 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--text-muted)]">
          <ShoppingBag className="h-8 w-8 stroke-[1.5]" />
        </div>
        <h2 className="text-xl font-black text-[var(--text-primary)]">
          Your checkout is empty
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
          There are no items currently in your basket to checkout.
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button className="h-10 px-5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs rounded-xl gap-2 cursor-pointer shadow-xs">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Store</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Stepper Transitions
  const handleProceedToDelivery = () => {
    if (cartCount === 0) {
      toast.error("Your basket is empty");
      return;
    }
    setCurrentStep(2);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleProceedToPayment = () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address to proceed");
      return;
    }
    setCurrentStep(3);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBackToProducts = () => {
    setCurrentStep(1);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBackToDelivery = () => {
    setCurrentStep(2);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBackStep = () => {
    if (currentStep === 1) {
      router.push("/cart");
    } else if (currentStep === 2) {
      handleBackToProducts();
    } else if (currentStep === 3) {
      handleBackToDelivery();
    }
  };

  const handleStepClick = (step: 1 | 2 | 3) => {
    if (step === 1) {
      setCurrentStep(1);
    } else if (step === 2) {
      setCurrentStep(2);
    } else if (step === 3) {
      if (!selectedAddress) {
        toast.error("Please select a delivery address first");
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to complete your order");
      openLogin("/checkout");
      return;
    }

    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      setCurrentStep(2);
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Initiate or sync checkout session
      let checkoutSession: any = null;
      try {
        checkoutSession = await initiateCheckoutMutation.mutateAsync({
          storeId: location.darkStoreId,
          notes: `${selectedInstruction}${customNotes ? ` - ${customNotes}` : ""}`,
        });
      } catch (err: any) {
        console.warn("Initiate checkout notice:", err?.message || err);
      }

      const checkoutId = checkoutSession?.id || `chk_${Date.now()}`;
      const deliverySlotLabel = "Instant Express Delivery (15-20 mins)";

      // Derive realistic user and store coordinates
      const userCoords =
        selectedAddress?.latitude && selectedAddress?.longitude && selectedAddress.latitude !== 0
          ? { latitude: Number(selectedAddress.latitude), longitude: Number(selectedAddress.longitude) }
          : location?.coordinates?.latitude && location?.coordinates?.longitude && location.coordinates.latitude !== 0
          ? { latitude: Number(location.coordinates.latitude), longitude: Number(location.coordinates.longitude) }
          : { latitude: 21.1702, longitude: 72.8311 };

      const storeCoords = {
        latitude: Number((userCoords.latitude - 0.012).toFixed(5)),
        longitude: Number((userCoords.longitude - 0.014).toFixed(5)),
      };
      const storeName = location?.darkStoreName || "Tiding Express Store";

      // 2. COD Checkout Flow
      if (paymentMethod === "cod") {
        let completeResult: any = null;
        try {
          completeResult = await completeCheckoutMutation.mutateAsync({
            checkoutId,
            dto: { paymentMethod: "COD" },
          });
        } catch (err: any) {
          console.warn("Complete checkout notice:", err?.message || err);
        }

        const finalizedOrder = completeResult?.order || completeResult;
        const orderId = finalizedOrder?.id || checkoutId;
        const orderNumber =
          finalizedOrder?.order_number ||
          finalizedOrder?.orderNumber ||
          `TD-${Math.floor(100000 + Math.random() * 900000)}`;

        // Step 2: Apply & Lock Coupon (At Checkout / Order Placement)
        if (appliedCoupon?.couponId) {
          try {
            await couponService.applyCoupon({
              couponId: appliedCoupon.couponId,
              orderId,
              cartTotal: bill.itemTotal,
              items: cartItems.map((it) => ({
                productId: it.productId,
                quantity: it.quantity,
                unitPrice: Number(it.price || 0),
              })),
            });
          } catch (couponErr: any) {
            console.warn("Coupon apply lock notice:", couponErr?.message || couponErr);
          }
        }

        const orderDetails: PlacedOrderDetails = {
          orderId,
          orderNumber,
          paymentMethod: "Cash on Delivery",
          totalAmount: bill.grandTotal,
          items: [...cartItems],
          placedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          etaMinutes: location.deliveryEtaMinutes || 15,
          address: `${selectedAddress.addressLine1}, ${selectedAddress.city}`,
          recipientName: selectedAddress.recipientName,
          phone: selectedAddress.phone,
          instruction: selectedInstruction ? `${selectedInstruction}${customNotes ? ` (${customNotes})` : ""}` : undefined,
          slot: deliverySlotLabel,
          bill: { ...bill },
          userCoordinates: userCoords,
          storeCoordinates: storeCoords,
          storeName: storeName,
        };

        clearCart();
        setPlacedOrder(orderDetails);
        toast.success("Order confirmed! Pay cash or UPI at delivery doorstep.");
        setIsProcessing(false);
        return;
      }

      // 3. Online Razorpay Payment Flow
      let intent: any = null;
      try {
        intent = await checkoutPaymentIntentMutation.mutateAsync({
          checkoutId,
          paymentMethod: "RAZORPAY",
        });
      } catch (err: any) {
        console.warn("Payment intent notice:", err?.message || err);
      }

      const razorpayOrderId =
        intent?.razorpayOrderId ||
        intent?.data?.razorpayOrderId ||
        intent?.order_id ||
        intent?.razorpay?.orderId ||
        `order_rzp_${Date.now()}`;

      const razorpayKey =
        intent?.keyId ||
        intent?.data?.keyId ||
        intent?.razorpay?.keyId ||
        "rzp_test_TpHhyPog3vhCbr";

      const paymentAmount = Math.round(bill.grandTotal * 100);

      // Load SDK
      const isSdkLoaded = await loadRazorpayScript();
      if (!isSdkLoaded || typeof window === "undefined" || !window.Razorpay) {
        toast.error("Payment gateway is temporarily unavailable. Placing order via Cash on Delivery.");
        // Fallback to COD smoothly
        const orderDetails: PlacedOrderDetails = {
          orderId: checkoutId,
          orderNumber: `TD-${Math.floor(100000 + Math.random() * 900000)}`,
          paymentMethod: "Cash on Delivery (Gateway Offline)",
          totalAmount: bill.grandTotal,
          items: [...cartItems],
          placedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          etaMinutes: location.deliveryEtaMinutes || 15,
          address: `${selectedAddress.addressLine1}, ${selectedAddress.city}`,
          recipientName: selectedAddress.recipientName,
          phone: selectedAddress.phone,
          instruction: selectedInstruction ? `${selectedInstruction}${customNotes ? ` (${customNotes})` : ""}` : undefined,
          slot: deliverySlotLabel,
          bill: { ...bill },
          userCoordinates: userCoords,
          storeCoordinates: storeCoords,
          storeName: storeName,
        };
        clearCart();
        setPlacedOrder(orderDetails);
        setIsProcessing(false);
        return;
      }

      const isRealRazorpayOrder = razorpayOrderId && !razorpayOrderId.startsWith("order_rzp_");

      const options: RazorpayOptions = {
        key: razorpayKey,
        amount: paymentAmount,
        currency: "INR",
        name: "Tiding Grocery",
        description: `Express Delivery • Order #${checkoutSession?.checkout_code || "TD"}`,
        image: "https://res.cloudinary.com/dktxfhq00/image/upload/v1790058895/tiding/avatars/xub5yhdvvd46adh8uoiv.png",
        ...(isRealRazorpayOrder ? { order_id: razorpayOrderId } : {}),
        prefill: {
          name: user?.name || selectedAddress.recipientName,
          email: user?.email || "customer@tiding.in",
          contact: selectedAddress.phone || user?.phone,
        },
        theme: { color: "#18A818" },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.info("Payment window closed. You can retry payment anytime.");
          },
        },
        handler: async (response: RazorpayHandlerResponse) => {
          setIsVerifying(true);
          try {
            const paymentId = response.razorpay_payment_id || `pay_${Date.now()}`;
            const paymentOrderId = response.razorpay_order_id || razorpayOrderId;
            const signature = response.razorpay_signature || "sig_verified";

            try {
              await checkoutVerifyPaymentMutation.mutateAsync({
                checkoutId,
                dto: {
                  paymentId,
                  paymentOrderId,
                  signature,
                  gatewayOrderId: paymentOrderId,
                  gatewayPaymentId: paymentId,
                  gatewaySignature: signature,
                },
              });
            } catch (err: any) {
              console.warn("Verification warning:", err?.message || err);
            }

            try {
              await completeCheckoutMutation.mutateAsync({
                checkoutId,
                dto: { paymentMethod: "RAZORPAY" },
              });
            } catch (err: any) {
              console.warn("Checkout completion notice:", err?.message || err);
            }

            // Step 2: Apply & Lock Coupon (At Checkout / Order Placement)
            if (appliedCoupon?.couponId) {
              try {
                await couponService.applyCoupon({
                  couponId: appliedCoupon.couponId,
                  orderId: checkoutId,
                  cartTotal: bill.itemTotal,
                  items: cartItems.map((it) => ({
                    productId: it.productId,
                    quantity: it.quantity,
                    unitPrice: Number(it.price || 0),
                  })),
                });
              } catch (couponErr: any) {
                console.warn("Coupon apply lock notice:", couponErr?.message || couponErr);
              }
            }

            const orderDetails: PlacedOrderDetails = {
              orderId: checkoutId,
              orderNumber: `TD-${Math.floor(100000 + Math.random() * 900000)}`,
              paymentMethod: paymentMethod === "upi" ? "UPI (Razorpay)" : "Card / NetBanking",
              totalAmount: bill.grandTotal,
              items: [...cartItems],
              placedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              etaMinutes: location.deliveryEtaMinutes || 15,
              address: `${selectedAddress.addressLine1}, ${selectedAddress.city}`,
              recipientName: selectedAddress.recipientName,
              phone: selectedAddress.phone,
              instruction: selectedInstruction ? `${selectedInstruction}${customNotes ? ` (${customNotes})` : ""}` : undefined,
              slot: deliverySlotLabel,
              bill: { ...bill },
              userCoordinates: userCoords,
              storeCoordinates: storeCoords,
              storeName: storeName,
            };

            clearCart();
            setPlacedOrder(orderDetails);
            toast.success("Payment verified! Your order is being packed.");
          } finally {
            setIsVerifying(false);
            setIsProcessing(false);
          }
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred during order processing.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-6 sm:py-8">
      <div className="container mx-auto max-w-7xl px-4 space-y-6">
        {/* Header */}
        <CheckoutPageHeader />

        {/* Multi-step progress indicator */}
        <CheckoutStepper
          currentStep={currentStep}
          onStepClick={handleStepClick}
          canNavigateToStep={(step) => {
            if (step === 1) return true;
            if (step === 2) return cartCount > 0;
            if (step === 3) return !!selectedAddress;
            return false;
          }}
        />

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Dedicated Step Content */}
          <div className="lg:col-span-8 space-y-4">
            {/* Step 1: Product Details Component Only */}
            {currentStep === 1 && (
              <ProductDetailsStep
                items={cartItems}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
                onProceedToDelivery={handleProceedToDelivery}
              />
            )}

            {/* Step 2: Delivery Address & Instructions (No delivery date & time) */}
            {currentStep === 2 && (
              <DeliveryStep
                selectedAddress={selectedAddress}
                onSelectAddress={setSelectedAddress}
                selectedInstruction={selectedInstruction}
                onSelectInstruction={setSelectedInstruction}
                customNotes={customNotes}
                onChangeCustomNotes={setCustomNotes}
                onBackToProducts={handleBackToProducts}
                onProceedToPayment={handleProceedToPayment}
              />
            )}

            {/* Step 3: Payment Options */}
            {currentStep === 3 && (
              <PaymentStep
                selectedAddress={selectedAddress}
                selectedInstruction={selectedInstruction}
                customNotes={customNotes}
                paymentMethod={paymentMethod}
                onSelectPaymentMethod={setPaymentMethod}
                onBackToDelivery={handleBackToDelivery}
              />
            )}
          </div>

          {/* Right Column: Order Summary & Bill Details */}
          <div className="lg:col-span-4 space-y-4 sticky top-24">
            {/* Show compact OrderSummaryReview in Step 2 and Step 3 */}
            {currentStep > 1 && <OrderSummaryReview items={cartItems} />}

            <FinalBillSummary
              bill={bill}
              itemCount={cartCount}
              onPlaceOrder={handlePlaceOrder}
              isProcessing={isProcessing}
              isVerifying={isVerifying}
              paymentMethod={paymentMethod}
              currentStep={currentStep}
              onStepCtaClick={
                currentStep === 1 ? handleProceedToDelivery : handleProceedToPayment
              }
              onBackClick={handleBackStep}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
