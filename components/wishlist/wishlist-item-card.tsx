"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { WishlistItem } from "@/types/wishlist";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Trash2,
  Settings2,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Bell,
  Sparkles,
} from "lucide-react";

interface WishlistItemCardProps {
  item: WishlistItem;
  onMoveToCart: (itemId: string) => Promise<unknown>;
  onRemove: (itemId: string, productId?: string, variantId?: string) => Promise<unknown>;
  onEdit: (item: WishlistItem) => void;
  isMoving?: boolean;
  isRemoving?: boolean;
}

export function WishlistItemCard({
  item,
  onMoveToCart,
  onRemove,
  onEdit,
  isMoving = false,
  isRemoving = false,
}: WishlistItemCardProps) {
  const [movingLocal, setMovingLocal] = useState(false);
  const [removingLocal, setRemovingLocal] = useState(false);

  const productName =
    item.productName || item.product_name || item.name || item.product?.name || "Product";
  const productSlug =
    item.productSlug || item.product_slug || item.slug || item.product?.slug || `product-${item.productId || item.product_id}`;
  const variantName =
    item.variantName || item.variant_name || item.variant?.name || item.unit || "";
  const thumbnail =
    item.image ||
    item.imageUrl ||
    item.image_url ||
    item.thumbnail_url ||
    item.thumbnailUrl ||
    item.product?.thumbnailUrl ||
    item.product?.images?.[0] ||
    "https://res.cloudinary.com/dktxfhq00/image/upload/v1792652242/tiding/products/qmtjpdqychk9dfl37eun.avif";

  const currentPrice = Number(
    item.sellingPrice ??
    item.selling_price ??
    item.currentPrice ??
    item.price ??
    item.variant?.price ??
    item.product?.price ??
    item.addedPrice ??
    0
  );

  const mrp = Number(
    item.mrp ??
    item.price ??
    item.originalPrice ??
    item.variant?.mrp ??
    item.product?.mrp ??
    Math.round(currentPrice * 1.2)
  );

  const addedPrice = Number(item.addedPrice ?? mrp);

  const priceDropAmount =
    mrp > currentPrice ? mrp - currentPrice : 0;
  const isPriceDropped = item.hasPriceDropped || priceDropAmount > 0;

  const inStock =
    typeof item.inStock === "boolean"
      ? item.inStock
      : typeof item.is_in_stock === "boolean"
      ? item.is_in_stock
      : item.availableStock !== undefined
      ? item.availableStock > 0
      : true;

  const handleMove = async () => {
    try {
      setMovingLocal(true);
      await onMoveToCart(item.id);
    } finally {
      setMovingLocal(false);
    }
  };

  const handleRemove = async () => {
    try {
      setRemovingLocal(true);
      await onRemove(item.id, item.productId, item.variantId);
    } finally {
      setRemovingLocal(false);
    }
  };

  return (
    <div className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-xs hover:shadow-md hover:border-gray-200 transition-all">
      {/* Product Image */}
      <Link
        href={`/product/${productSlug}`}
        className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 border border-gray-100"
      >
        <Image
          src={thumbnail}
          alt={productName}
          fill
          sizes="(max-width: 640px) 96px, 112px"
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
        />

        {/* Priority Badge */}
        {item.priority === "HIGH" && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-rose-500 text-white font-black text-[9px] uppercase tracking-wider shadow-xs">
            High
          </span>
        )}
      </Link>

      {/* Product & Variant Details */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Stock Status Badge */}
          {inStock ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <span>In Stock</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
              <XCircle className="h-3 w-3 text-rose-600" />
              <span>Out of Stock</span>
            </span>
          )}

          {/* Price Drop Alert Tag */}
          {isPriceDropped && (
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 animate-pulse">
              <TrendingDown className="h-3 w-3 text-amber-600" />
              <span>Price Dropped by {formatCurrency(priceDropAmount)}!</span>
            </span>
          )}

          {item.notifyOnPriceDrop && (
            <span
              title="Price drop alerts enabled"
              className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"
            >
              <Bell className="h-2.5 w-2.5 text-gray-600" />
              <span>Alert Active</span>
            </span>
          )}
        </div>

        <Link
          href={`/product/${productSlug}`}
          className="block font-bold text-sm sm:text-base text-gray-900 hover:text-[#0c831f] transition-colors truncate"
        >
          {productName}
        </Link>

        <p className="text-xs text-gray-500 font-medium">
          {variantName}
        </p>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="text-base sm:text-lg font-black text-gray-900">
            {formatCurrency(currentPrice)}
          </span>
          {mrp > currentPrice && (
            <span className="text-xs text-gray-400 line-through">
              {formatCurrency(mrp)}
            </span>
          )}
          {mrp > currentPrice && (
            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
              {Math.round(((mrp - currentPrice) / mrp) * 100)}% OFF
            </span>
          )}
        </div>

        {/* Personal Note if any */}
        {item.notes && (
          <p className="text-xs text-amber-900/80 bg-amber-50/70 border border-amber-100 rounded-lg px-2.5 py-1 inline-block mt-1 font-medium italic">
            &ldquo;{item.notes}&rdquo;
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center sm:flex-col gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
        <Button
          onClick={handleMove}
          disabled={!inStock || isMoving || movingLocal}
          className="flex-1 sm:w-36 h-10 bg-[#0c831f] hover:bg-[#0a6f1a] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {movingLocal || isMoving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Moving...</span>
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              <span>Move to Cart</span>
            </>
          )}
        </Button>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit(item)}
            className="h-9 px-2.5 text-xs font-semibold text-gray-700 hover:text-gray-900 border-gray-200 rounded-xl cursor-pointer"
            title="Edit item notes and priority"
          >
            <Settings2 className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={isRemoving || removingLocal}
            className="h-9 px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border-gray-200 hover:border-rose-200 rounded-xl cursor-pointer"
            title="Remove from wishlist"
          >
            {removingLocal ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
