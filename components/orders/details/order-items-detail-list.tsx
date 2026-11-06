"use client";

import React from "react";
import { BackendOrderItem } from "@/types/order";
import { formatCurrency } from "@/lib/utils";
import { Package, Loader2 } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";

interface OrderItemsDetailListProps {
  items: BackendOrderItem[];
  isLoading?: boolean;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200";

export function OrderItemsDetailList({
  items,
  isLoading = false,
}: OrderItemsDetailListProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-2xs transition-all hover:border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-1 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Package className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-gray-900">
            Items Ordered
            <span className="ml-1.5 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </h4>
        </div>

        {isLoading && (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
            <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
            <span>Updating...</span>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="divide-y divide-gray-100">
        {items.map((item, idx) => {
          const name =
            item.productName ||
            item.product_name ||
            item.name ||
            `Item #${idx + 1}`;
          const qty = item.quantity || item.qty || 1;
          const price = Number(
            item.unitPrice || item.unit_price || item.price || 0
          );
          const itemTotal = Number(
            item.totalPrice || item.total_price || price * qty || 0
          );
          const img =
            item.imageUrl ||
            item.image_url ||
            item.thumbnail_url ||
            item.image ||
            FALLBACK_IMAGE;

          const unitPriceDisplay = formatCurrency(price || (itemTotal > 0 ? itemTotal / qty : 0));
          const totalDisplay = formatCurrency(itemTotal || price * qty);

          return (
            <div
              key={item.id || item.productId || idx}
              className="py-3 sm:py-3.5 flex items-center justify-between gap-3 group/item transition-colors hover:bg-gray-50/50 -mx-2 px-2 rounded-xl"
            >
              {/* Product Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl border border-gray-100 bg-gray-50/80 p-1 shrink-0 flex items-center justify-center overflow-hidden transition-transform group-hover/item:scale-105">
                  <SafeImage
                    src={img}
                    alt={name}
                    width={48}
                    height={48}
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                    {name}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                    {item.unit && (
                      <span className="bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded font-medium text-[10px]">
                        {item.unit}
                      </span>
                    )}
                    <span>
                      {unitPriceDisplay} × {qty}
                    </span>
                  </div>
                </div>
              </div>

              {/* Item Total Price */}
              <div className="text-right shrink-0">
                <span className="text-xs sm:text-sm font-bold text-gray-900 tabular-nums">
                  {totalDisplay}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

