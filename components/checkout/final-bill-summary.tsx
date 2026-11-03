"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Lock, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { BillBreakdown } from "@/types/cart";

interface FinalBillSummaryProps {
  bill: BillBreakdown;
  itemCount: number;
  onPlaceOrder: () => void;
  isProcessing?: boolean;
  isVerifying?: boolean;
  paymentMethod: string;
  currentStep?: 1 | 2 | 3;
  onStepCtaClick?: () => void;
  onBackClick?: () => void;
}

export function FinalBillSummary({
  bill,
  itemCount,
  onPlaceOrder,
  isProcessing = false,
  isVerifying = false,
  paymentMethod,
  currentStep = 3,
  onStepCtaClick,
  onBackClick,
}: FinalBillSummaryProps) {
  const router = useRouter();
  const isFreeDelivery = bill.deliveryFee === 0;
  const totalSavings = (bill.discountTotal || 0) + (bill.couponDiscount || 0);

  const getButtonText = () => {
    if (isVerifying) return "Verifying Payment...";
    if (isProcessing) return "Processing Order...";

    if (currentStep === 1) return "Proceed to Delivery";
    if (currentStep === 2) return "Proceed to Payment";

    if (paymentMethod === "cod") return `Place Order • ${formatCurrency(bill.grandTotal)}`;
    return `Pay & Place Order • ${formatCurrency(bill.grandTotal)}`;
  };

  const handleCtaClick = () => {
    if (currentStep === 3) {
      onPlaceOrder();
    } else if (onStepCtaClick) {
      onStepCtaClick();
    }
  };

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else if (currentStep === 1) {
      router.push("/cart");
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-xs space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-light)]">
        <h3 className="text-base text-[var(--text-primary)]">
          Bill Summary
        </h3>
        <span className="text-xs text-[var(--text-secondary)]">
          ({itemCount} items)
        </span>
      </div>

      {/* Breakdown */}
      <div className="space-y-2.5 text-xs">
        {/* Item Total */}
        <div className="flex items-center justify-between text-[var(--text-secondary)]">
          <span>Item total</span>
          <span className="text-[var(--text-primary)]">
            {formatCurrency(bill.mrpTotal || bill.itemTotal)}
          </span>
        </div>

        {/* Product Discount */}
        {(bill.discountTotal || 0) > 0 && (
          <div className="flex items-center justify-between text-[var(--primary)]">
            <span>Product discount</span>
            <span>-{formatCurrency(bill.discountTotal)}</span>
          </div>
        )}

        {/* Coupon Discount */}
        {(bill.couponDiscount || 0) > 0 && (
          <div className="flex items-center justify-between text-[var(--primary)]">
            <span>Coupon discount ({bill.couponCode})</span>
            <span>-{formatCurrency(bill.couponDiscount)}</span>
          </div>
        )}

        {/* Delivery Charges */}
        <div className="flex items-center justify-between text-[var(--text-secondary)]">
          <span>Delivery charges</span>
          {isFreeDelivery ? (
            <span className="text-[var(--primary)]">FREE</span>
          ) : (
            <span className="text-[var(--text-primary)]">
              {formatCurrency(bill.deliveryFee)}
            </span>
          )}
        </div>

        {/* Handling Charges */}
        {bill.handlingFee > 0 && (
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span>Handling charges</span>
            <span className="text-[var(--text-primary)]">
              {formatCurrency(bill.handlingFee)}
            </span>
          </div>
        )}

        {/* Total Payable Amount */}
        <div className="pt-3 border-t border-[var(--border)] flex items-baseline justify-between">
          <div>
            <span className="text-sm text-[var(--text-primary)]">
              Payable Amount
            </span>
            <p className="text-[11px] text-[var(--text-muted)]">
              Inclusive of all taxes
            </p>
          </div>
          <span className="text-lg text-[var(--text-primary)]">
            {formatCurrency(bill.grandTotal)}
          </span>
        </div>
      </div>

      {/* Savings highlight */}
      {totalSavings > 0 && (
        <div className="rounded-xl bg-[var(--primary-light)] border border-[var(--primary)]/30 p-2.5 flex items-center justify-center gap-1.5 text-xs text-[var(--primary)] text-center">
          <Sparkles className="h-4 w-4 text-[var(--primary)] fill-[var(--primary)]" />
          <span>You saved {formatCurrency(totalSavings)} on this order!</span>
        </div>
      )}

      {/* Two Action Buttons together at bottom right */}
      <div className="flex gap-2.5 pt-2">

        <Button
          type="button"
          onClick={handleCtaClick}
          disabled={isProcessing || isVerifying || itemCount === 0}
          className="flex-1 w-full sm:flex-initial h-11 px-5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] cursor-pointer"
        >
          {isProcessing || isVerifying ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{getButtonText()}</span>
            </>
          ) : (
            <>
              <span>{getButtonText()}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </div>

      {/* Security note */}
      <div className="space-y-1.5 pt-1 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-muted)]">
          <Lock className="h-3.5 w-3.5 text-[var(--primary)]" />
          <span>Safe & Secure Checkout</span>
        </div>
        <p className="text-[10px] text-[var(--text-muted)]">
          By placing this order, you agree to Tiding&apos;s Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}