"use client";

import React from "react";
import Link from "next/link";
import { Receipt, CreditCard, Sparkles, Package, ChevronRight, Home, IndianRupeeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

import { OrderInvoiceButton } from "./order-invoice-button";

interface OrderBillCardProps {
  itemsSubtotal: number;
  handlingFee: number;
  totalSavings: number;
  totalAmount: number;
  paymentMethod: string;
  orderId?: string;
  orderNumber?: string;
  orderStatus?: string;
}

export function OrderBillCard({
  itemsSubtotal,
  handlingFee,
  totalSavings,
  totalAmount,
  paymentMethod,
  orderId,
  orderNumber,
  orderStatus,
}: OrderBillCardProps) {
  return (
    <div className="space-y-4">
      {/* Bill Details Box */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-3.5 flex items-center gap-2 pb-2 border-b border-[var(--border-light)]">
          <IndianRupeeIcon className="h-4.5 w-4.5 text-[var(--primary)]" />
          <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
            Bill Details
          </h3>
        </div>

        <dl className="space-y-2.5 text-xs sm:text-sm text-[var(--text-secondary)]">
          <div className="flex items-center justify-between">
            <dt>Items Total</dt>
            <dd className="text-[var(--text-primary)] font-medium">
              {formatCurrency(itemsSubtotal)}
            </dd>
          </div>

          <div className="flex items-center justify-between">
            <dt>Delivery Charge</dt>
            <dd className="text-[var(--primary)] font-bold">FREE</dd>
          </div>

          {handlingFee > 0 && (
            <div className="flex items-center justify-between">
              <dt>Handling & Packaging</dt>
              <dd className="text-[var(--text-primary)] font-medium">
                {formatCurrency(handlingFee)}
              </dd>
            </div>
          )}

          {totalSavings > 0 && (
            <div className="flex items-center justify-between text-[var(--primary)] font-medium">
              <dt>Product Savings</dt>
              <dd>-{formatCurrency(totalSavings)}</dd>
            </div>
          )}
        </dl>

        {/* Total Paid */}
        <div className="mt-4 flex items-center justify-between border-t border-dashed border-[var(--border)] pt-3.5">
          <div>
            <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
              Total Paid
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
              <CreditCard className="h-3 w-3" />
              <span>{paymentMethod}</span>
            </p>
          </div>
          <p className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
            {formatCurrency(totalAmount)}
          </p>
        </div>

        {/* Savings Badge */}
        {totalSavings > 0 && (
          <div className="mt-3.5 rounded-xl bg-[var(--primary-light)] border border-[var(--primary)]/20 px-3 py-2 text-center text-xs text-[var(--primary)] font-medium flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>You saved {formatCurrency(totalSavings)} on this order!</span>
          </div>
        )}

        {/* Invoice Actions */}
        {orderId && (
          <OrderInvoiceButton
            orderId={orderId}
            orderNumber={orderNumber}
            orderStatus={orderStatus}
          />
        )}
      </div>

      {/* Action CTA Buttons */}
      <div className="space-y-2.5">
        <Link href="/orders" className="block">
          <Button
            size="lg"
            className="h-11 w-full cursor-pointer justify-between rounded-xl bg-[var(--primary)] px-4 text-xs sm:text-sm text-white hover:bg-[var(--primary-hover)] shadow-xs"
          >
            <span className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>View All Orders</span>
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>

        <Link href="/" className="block">
          <Button
            variant="outline"
            size="lg"
            className="h-11 w-full cursor-pointer rounded-xl border-[var(--border)] bg-white text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]"
          >
            <span className="flex items-center gap-1.5">
              <Home className="h-4 w-4" />
              <span>Continue Shopping</span>
            </span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
