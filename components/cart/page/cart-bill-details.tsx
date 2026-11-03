"use client";

import React from "react";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Check,
  Loader2,
  Receipt,
  BadgePercent,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { BillBreakdown } from "@/types/cart";

interface CartBillDetailsProps {
  bill: BillBreakdown;
  itemCount: number;
  onProceedToCheckout: () => void;
  isValidating?: boolean;
}

export function CartBillDetails({
  bill,
  itemCount,
  onProceedToCheckout,
  isValidating = false,
}: CartBillDetailsProps) {
  const isFreeDelivery = bill.deliveryFee === 0;
  const totalSavings = (bill.discountTotal || 0) + (bill.couponDiscount || 0);
  const itemLabel = `${itemCount} ${itemCount === 1 ? "item" : "items"}`;

  const freeDeliveryProgress =
    bill.freeDeliveryThreshold > 0
      ? Math.min(100, (bill.itemTotal / bill.freeDeliveryThreshold) * 100)
      : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-light)] bg-gradient-to-r from-[var(--primary-light)] to-transparent px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--brand-green-dark)] text-white shadow-sm shadow-[var(--primary)]/25">
            <IndianRupee className="h-4 w-4 stroke-[2.5]" />
          </div>
          <h3 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
            Price Details
          </h3>
        </div>
        <span className="rounded-full bg-[var(--surface-secondary)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)] ring-1 ring-[var(--border-light)]">
          {itemLabel}
        </span>
      </div>

      <div className="space-y-4 p-5">
        {/* Free Delivery Bar */}
        {bill.amountNeededForFreeDelivery > 0 ? (
          <div className="space-y-2.5 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-amber-50/40 p-3.5">
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <Truck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-snug text-amber-900">
                  Add{" "}
                  <span className="font-bold">
                    {formatCurrency(bill.amountNeededForFreeDelivery)}
                  </span>{" "}
                  more for FREE delivery
                </p>
                <p className="text-[11px] font-medium text-amber-700">
                  Free above {formatCurrency(bill.freeDeliveryThreshold)}
                </p>
              </div>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-amber-200/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--secondary)] to-[var(--primary)] transition-all duration-500"
                style={{ width: `${freeDeliveryProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl border border-[var(--primary)]/25 bg-[var(--primary-light)] p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-sm shadow-[var(--primary)]/30">
              <Check className="h-4 w-4 stroke-[3]" />
            </div>
            <span className="text-xs font-semibold text-[var(--brand-green-dark)]">
              Yay! You unlocked FREE express delivery on this order!
            </span>
          </div>
        )}

        {/* Line Items */}
        <div className="space-y-3 text-[13px]">
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span>Price ({itemLabel})</span>
            <span className="font-semibold tabular-nums text-[var(--text-primary)]">
              {formatCurrency(bill.mrpTotal || bill.itemTotal)}
            </span>
          </div>

          {(bill.discountTotal || 0) > 0 && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-[var(--text-secondary)]">
                Product discount
              </span>
              <span className="rounded-md bg-[var(--primary-light)] px-2 py-0.5 text-xs font-semibold tabular-nums text-[var(--brand-green-dark)] ring-1 ring-[var(--primary)]/20">
                -{formatCurrency(bill.discountTotal)}
              </span>
            </div>
          )}

          {(bill.couponDiscount || 0) > 0 && (
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-1.5 font-medium text-[var(--text-secondary)]">
                Coupon discount
                {bill.couponCode && (
                  <span className="truncate rounded-md border border-dashed border-[var(--primary)]/40 bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-green-dark)]">
                    {bill.couponCode}
                  </span>
                )}
              </span>
              <span className="shrink-0 rounded-md bg-[var(--primary-light)] px-2 py-0.5 text-xs font-semibold tabular-nums text-[var(--brand-green-dark)] ring-1 ring-[var(--primary)]/20">
                -{formatCurrency(bill.couponDiscount)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span>Delivery fee</span>
            {isFreeDelivery ? (
              <span className="rounded-md bg-[var(--primary)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Free
              </span>
            ) : (
              <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                {formatCurrency(bill.deliveryFee)}
              </span>
            )}
          </div>

          {bill.handlingFee > 0 && (
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span>Handling fee</span>
              <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                {formatCurrency(bill.handlingFee)}
              </span>
            </div>
          )}
        </div>

        {/* Total Amount */}
        <div className="flex items-center justify-between rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/70 px-4 py-3">
          <div>
            <span className="text-sm font-bold text-[var(--text-primary)]">
              Total Amount
            </span>
            <p className="text-[11px] font-medium text-[var(--text-muted)]">
              Inclusive of all taxes
            </p>
          </div>
          <span className="text-xl font-bold tracking-tight tabular-nums text-[var(--text-primary)]">
            {formatCurrency(bill.grandTotal)}
          </span>
        </div>

        {/* Savings Callout */}
        {totalSavings > 0 && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-[var(--primary)]/25 bg-gradient-to-r from-[var(--primary-light)] via-[var(--secondary-light)] to-[var(--primary-light)] p-3 text-center text-xs font-semibold text-[var(--brand-green-dark)]">
            <BadgePercent className="h-4 w-4 shrink-0 text-[var(--primary)]" />
            <span>
              You will save{" "}
              <span className="font-bold">{formatCurrency(totalSavings)}</span>{" "}
              on this order
            </span>
          </div>
        )}

        {/* Primary Proceed CTA */}
        <Button
          onClick={onProceedToCheckout}
          disabled={isValidating || itemCount === 0}
          size="lg"
          className="group h-14 w-full cursor-pointer items-center justify-between rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--brand-green-dark)] px-5 text-sm font-semibold text-white shadow-lg shadow-[var(--primary)]/25 transition-all duration-200 hover:from-[var(--primary-hover)] hover:to-[#065f2c] hover:shadow-[var(--primary)]/35 active:scale-[0.98] disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none"
        >
          {isValidating ? (
            <span className="flex w-full items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Validating Basket...</span>
            </span>
          ) : (
            <>
              <div className="text-left leading-tight">
                <span className="block text-[11px] font-normal opacity-90">
                  Total Payable
                </span>
                <span className="text-base font-bold tabular-nums">
                  {formatCurrency(bill.grandTotal)}
                </span>
              </div>
              <span className="flex items-center gap-2 font-semibold">
                <span>Proceed to Checkout</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </span>
            </>
          )}
        </Button>

        {/* Trust & Safe Delivery */}
        <div className="flex items-center justify-center gap-2 border-t border-[var(--border-light)] pt-3 text-[11px] font-medium text-[var(--text-muted)]">
          <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
          <span>Safe & Secure Checkout • 100% Authentic Quality</span>
        </div>
      </div>
    </div>
  );
}