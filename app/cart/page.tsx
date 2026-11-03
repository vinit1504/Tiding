"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { CartHeader } from "@/components/cart/page/cart-header";
import { DeliveryInfoBanner } from "@/components/cart/page/delivery-info-banner";
import { CartProductList } from "@/components/cart/page/cart-product-list";
import { CartCouponCard } from "@/components/cart/page/cart-coupon-card";
import { CartBillDetails } from "@/components/cart/page/cart-bill-details";
import { CartRecommendations } from "@/components/cart/page/cart-recommendations";
import { CartEmptyState } from "@/components/cart/page/cart-empty-state";
import { CartSkeleton } from "@/components/cart/page/cart-skeleton";
import { InventoryValidationModal } from "@/components/cart/inventory-validation-modal";
import { CheckoutValidationWarning } from "@/types/cart";
import { toast } from "sonner";

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    cartCount,
    bill,
    appliedCoupon,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    validateCheckout,
    isSyncing,
  } = useCart();

  const { isAuthenticated, openLogin } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<
    CheckoutValidationWarning[] | null
  >(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <CartSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <CartEmptyState />
      </div>
    );
  }

  const handleProceedToCheckout = async () => {
    if (!isAuthenticated) {
      toast.info("Please log in to proceed with checkout", {
        description: "Your cart items are saved and ready.",
      });
      openLogin("/checkout");
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateCheckout();
      if (!result.isCheckoutReady && result.warnings.length > 0) {
        setValidationWarnings(result.warnings);
        return;
      }
      router.push("/checkout");
    } catch {
      router.push("/checkout");
    } finally {
      setIsValidating(false);
    }
  };

  const handleUpdateCartAndProceed = () => {
    if (validationWarnings && validationWarnings.length > 0) {
      for (const warning of validationWarnings) {
        const targetItem = items.find(
          (it) =>
            it.id === warning.itemId ||
            it.variantId === warning.variantId ||
            it.cartItemId === warning.itemId
        );
        if (targetItem) {
          const itemIdentifier = targetItem.cartItemId || targetItem.id;
          const avail = warning.availableStock ?? 0;
          if (avail <= 0 || warning.type === "ITEM_UNAVAILABLE") {
            removeItem(itemIdentifier);
          } else {
            updateQuantity(itemIdentifier, avail);
          }
        }
      }
    }
    setValidationWarnings(null);
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-6 sm:py-8">
      <div className="container mx-auto max-w-7xl px-4 space-y-6">
        {/* Header */}
        <CartHeader totalItems={cartCount} />

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Delivery Banner + Items List */}
          <div className="lg:col-span-8 space-y-4">
            <DeliveryInfoBanner />
            <CartProductList
              items={items}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              onClearCart={clearCart}
            />
          </div>

          {/* Right Column: Coupons + Bill Breakdown */}
          <div className="lg:col-span-4 space-y-4 sticky top-24">
            <CartCouponCard
              appliedCoupon={appliedCoupon}
              onApplyCoupon={applyCoupon}
              onRemoveCoupon={removeCoupon}
              cartTotal={bill.itemTotal}
            />
            <CartBillDetails
              bill={bill}
              itemCount={cartCount}
              onProceedToCheckout={handleProceedToCheckout}
              isValidating={isValidating}
            />
          </div>
        </div>

        {/* Bottom Recommendations */}
        <div className="pt-4">
          <CartRecommendations />
        </div>
      </div>

      {/* Out of stock or inventory conflict modal */}
      <InventoryValidationModal
        isOpen={!!validationWarnings && validationWarnings.length > 0}
        warnings={validationWarnings || []}
        onClose={() => setValidationWarnings(null)}
        onUpdateCartAndProceed={handleUpdateCartAndProceed}
      />
    </div>
  );
}
