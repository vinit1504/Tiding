"use client";

import React from "react";
import { CartItem } from "@/types/cart";
import { CartItemRow } from "./cart-item-row";
import { AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartProductListProps {
  items: CartItem[];
  onUpdateQuantity: (identifier: string, qty: number) => void;
  onRemoveItem: (identifier: string) => void;
  onClearCart?: () => void;
  isUpdatingItem?: (identifier: string) => boolean;
  isRemovingItem?: (identifier: string) => boolean;
}

export function CartProductList({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  isUpdatingItem,
  isRemovingItem,
}: CartProductListProps) {
  const outOfStockItems = items.filter(
    (it) => it.maxStock !== undefined && it.maxStock <= 0
  );

  return (
    <div className="space-y-4">
      {/* List Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
          Items in your basket ({items.length})
        </h2>
        {onClearCart && items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCart}
            className="h-8 px-2.5 text-xs text-[var(--error)] hover:text-red-700 hover:bg-[var(--error)]/10 gap-1.5 font-medium transition-all cursor-pointer rounded-lg"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Basket
          </Button>
        )}
      </div>

      {/* Out of stock warning banner if any */}
      {outOfStockItems.length > 0 && (
        <div className="rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/10 dark:bg-[var(--warning)]/15 p-3.5 flex items-start gap-3 text-xs text-[var(--text-primary)] shadow-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-[var(--warning)] mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">
              {outOfStockItems.length} {outOfStockItems.length === 1 ? "item is" : "items are"} currently out of stock in your area store.
            </p>
            <p className="text-[var(--text-secondary)]">
              Please remove unavailable items to ensure instant express delivery.
            </p>
          </div>
        </div>
      )}

      {/* Items list container */}
      <div className="space-y-3">
        {items.map((item) => {
          const id = item.cartItemId || item.id;
          return (
            <div
              key={id}
              className="transition-all duration-200"
            >
              <CartItemRow
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
                isUpdating={isUpdatingItem ? isUpdatingItem(id) : false}
                isRemoving={isRemovingItem ? isRemovingItem(id) : false}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}