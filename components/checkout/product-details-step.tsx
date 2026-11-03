"use client";

import React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  ShieldCheck,
  Zap,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { CartItem } from "@/types/cart";
import { formatCurrency } from "@/lib/utils";

interface ProductDetailsStepProps {
  items: CartItem[];
  onUpdateQuantity: (identifier: string, qty: number) => void;
  onRemoveItem: (identifier: string) => void;
  onProceedToDelivery: () => void;
}

export function ProductDetailsStep({
  items,
  onUpdateQuantity,
  onRemoveItem,
}: ProductDetailsStepProps) {
  const totalItemCount = items.reduce((sum, it) => sum + (it.quantity || 1), 0);

  return (
    <div className="space-y-4">
      {/* Product Details Card Box */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6 shadow-xs space-y-5">
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border-light)] gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg text-[var(--text-primary)]">
                  Step 1: Product Details
                </h2>
                <span className="rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-[11px] px-2.5 py-0.5">
                  {totalItemCount} {totalItemCount === 1 ? "Item" : "Items"}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Review and confirm the items in your basket before proceeding to delivery
              </p>
            </div>
          </div>
        </div>

        {/* Product List */}
        <div className="divide-y divide-[var(--border-light)]">
          {items.map((item) => {
            const identifier = item.cartItemId || item.variantId || item.productId || item.id;
            const unitPrice = Number(item.price || 0);
            const mrp = Number(item.mrp || 0);
            const hasDiscount = mrp > unitPrice;
            const discountSavings = hasDiscount ? (mrp - unitPrice) * item.quantity : 0;
            const subtotal = unitPrice * item.quantity;

            return (
              <div
                key={identifier}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Product Info */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-1.5 flex items-center justify-center overflow-hidden">
                    <SafeImage
                      src={item.image_url}
                      alt={item.name}
                      width={72}
                      height={72}
                      className="h-full w-full object-contain"
                    />
                    {hasDiscount && (
                      <span className="absolute top-1 left-1 bg-[var(--primary)] text-white text-[9px] px-1 rounded-sm leading-tight">
                        SAVE
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <h4 className="text-sm text-[var(--text-primary)] line-clamp-2">
                      {item.name}
                    </h4>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {item.unit && (
                        <span className="inline-block rounded-md bg-[var(--surface-secondary)] px-2 py-0.5 text-[var(--text-secondary)] text-[11px]">
                          {item.unit}
                        </span>
                      )}

                      <span className="text-[var(--text-primary)]">
                        {formatCurrency(unitPrice)}
                      </span>

                      {hasDiscount && (
                        <span className="text-[11px] line-through text-[var(--text-muted)]">
                          {formatCurrency(mrp)}
                        </span>
                      )}

                      {discountSavings > 0 && (
                        <span className="text-[10px] text-[var(--primary)] bg-[var(--primary-light)] px-1.5 py-0.5 rounded">
                          Save {formatCurrency(discountSavings)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-light)]">
                  {/* Quantity Adjuster */}
                  <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-0.5 shadow-2xs">
                    {item.quantity === 1 ? (
                      <button
                        type="button"
                        onClick={() => onRemoveItem(identifier)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(identifier, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-white hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                        title="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <span className="w-9 text-center text-xs text-[var(--text-primary)]">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(identifier, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--primary)] hover:bg-white transition-colors cursor-pointer"
                      title="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right min-w-[70px]">
                    <span className="text-sm sm:text-base text-[var(--text-primary)]">
                      {formatCurrency(subtotal)}
                    </span>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {formatCurrency(unitPrice)} × {item.quantity}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Assurance Badges */}
        <div className="rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[var(--primary)] shrink-0" />
            <span>Superfast Express Packing</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[var(--primary)] shrink-0" />
            <span>100% Quality Guaranteed</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--primary)] shrink-0" />
            <span>Fresh Stock From Store</span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons (Outside the box, exactly like Step 2 and Step 3) */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        <Link href="/cart" className="w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto h-11 px-5 border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] text-xs rounded-xl gap-2 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Cart</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}