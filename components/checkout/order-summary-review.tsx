"use client";

import React from "react";
import { ShoppingBag } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { CartItem } from "@/types/cart";
import { formatCurrency } from "@/lib/utils";

interface OrderSummaryReviewProps {
  items: CartItem[];
}

export function OrderSummaryReview({ items }: OrderSummaryReviewProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary-light)] text-[var(--primary)]">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base text-[var(--text-primary)]">
              Order Summary
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)]">
              {items.length} {items.length === 1 ? "Product" : "Products"} in your order
            </p>
          </div>
        </div>

        <span className="text-[11px] text-[var(--text-muted)]">
          Review only
        </span>
      </div>

      {/* List of items */}
      <div className="divide-y divide-[var(--border-light)] max-h-72 overflow-y-auto pr-1">
        {items.map((item) => {
          const id = item.cartItemId || item.id;
          const unitPrice = Number(item.price || 0);
          const subtotal = unitPrice * item.quantity;

          return (
            <div key={id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative h-12 w-12 shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-1 flex items-center justify-center overflow-hidden">
                  <SafeImage
                    src={item.image_url}
                    alt={item.name}
                    width={44}
                    height={44}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs text-[var(--text-primary)] truncate">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                    {item.unit && <span>{item.unit}</span>}
                    <span>•</span>
                    <span className="text-[var(--primary)]">Qty: {item.quantity}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs text-[var(--text-primary)]">
                  {formatCurrency(subtotal)}
                </span>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {formatCurrency(unitPrice)} each
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}