"use client";

import React from "react";
import { ShoppingBag } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { formatCurrency } from "@/lib/utils";
import { CartItem } from "@/types/cart";

interface OrderItemsCardProps {
  items: CartItem[];
  totalUnits: number;
}

export function OrderItemsCard({ items, totalUnits }: OrderItemsCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-light)] p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
            <ShoppingBag className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
              {items.length} {items.length === 1 ? "Item" : "Items"}
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {totalUnits} {totalUnits === 1 ? "unit" : "units"} in total
            </p>
          </div>
        </div>
      </div>

      {/* Items list */}
      <ul className="divide-y divide-[var(--border-light)] px-4 sm:px-5 max-h-[360px] overflow-y-auto">
        {items.map((item, idx) => {
          const unitPrice = Number(item.price || 0);
          const mrp = Number(item.mrp || 0);
          const qty = item.quantity || 1;
          const hasDiscount = mrp > unitPrice;
          const lineTotal = unitPrice * qty;

          return (
            <li
              key={item.cartItemId || item.id || idx}
              className="flex items-center gap-3 py-3.5 first:pt-4 last:pb-4"
            >
              {/* Product Thumbnail */}
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-1">
                <SafeImage
                  src={item.image_url}
                  alt={item.name}
                  width={52}
                  height={52}
                  className="h-full w-full object-contain"
                />
                <span className="absolute -right-0 -top-0 rounded-bl-lg bg-[var(--primary)] px-1.5 py-0.5 text-[9px] font-bold text-white">
                  ×{qty}
                </span>
              </div>

              {/* Item Info */}
              <div className="min-w-0 flex-1">
                <h4 className="line-clamp-2 text-xs sm:text-sm text-[var(--text-primary)] font-medium">
                  {item.name}
                </h4>
                {item.unit && (
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                    {item.unit}
                  </p>
                )}
              </div>

              {/* Pricing */}
              <div className="shrink-0 text-right">
                <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                  {formatCurrency(lineTotal)}
                </p>
                {hasDiscount && (
                  <p className="text-[10px] text-[var(--text-muted)] line-through">
                    {formatCurrency(mrp * qty)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
