"use client";

import React from "react";
import { SafeImage } from "@/components/ui/safe-image";
import { BackendOrderItem } from "@/types/order";

interface OrderItemsThumbnailsProps {
  items: BackendOrderItem[];
  itemsCount?: number;
}

export function OrderItemsThumbnails({
  items,
  itemsCount,
}: OrderItemsThumbnailsProps) {
  if (!items || items.length === 0) return null;

  const totalCount = itemsCount || items.length;
  const hasExtra = totalCount > items.length;

  return (
    <div className="flex items-center gap-3 overflow-x-auto pt-1 pb-0.5">
      {items.map((item, idx) => {
        const name =
          item.productName || item.product_name || item.name || "Product";
        const img =
          item.imageUrl ||
          item.image_url ||
          item.thumbnail_url ||
          item.image ||
          "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200";
        const qty = item.quantity || item.qty || 1;

        return (
          <div
            key={idx}
            className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-xl border border-gray-200/90 bg-white p-1 flex items-center justify-center overflow-hidden relative group"
            title={name}
          >
            <SafeImage
              src={img}
              alt={name}
              width={60}
              height={60}
              className="h-full w-full object-contain"
            />
            {qty > 1 && (
              <span className="absolute bottom-1 right-1 bg-gray-900/80 text-white text-[9px] font-bold px-1 rounded">
                {qty}x
              </span>
            )}
          </div>
        );
      })}

      {hasExtra && (
        <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-[11px] font-bold text-gray-500">
          +{totalCount - items.length}
        </div>
      )}
    </div>
  );
}
