"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Minus, Trash2, Heart, AlertCircle, Loader2 } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { CartItem } from "@/types/cart";
import { formatCurrency, cn } from "@/lib/utils";
import { useWishlist } from "@/hooks/use-wishlist";
import { popElement, burstHearts } from "@/lib/utils/wishlist-animation";
import { toast } from "sonner";

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (identifier: string, qty: number) => void;
  onRemoveItem: (identifier: string) => void;
  isUpdating?: boolean;
  isRemoving?: boolean;
}

export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemoveItem,
  isUpdating = false,
  isRemoving = false,
}: CartItemRowProps) {
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [optimisticWishlisted, setOptimisticWishlisted] = useState<boolean | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const identifier = item.cartItemId || item.id;
  const unitPrice = Number(item.price || 0);
  const mrp = Number(item.mrp || item.price || 0);
  const discountPercent = mrp > unitPrice ? Math.round(((mrp - unitPrice) / mrp) * 100) : 0;
  const itemTotal = unitPrice * item.quantity;
  const maxLimit = item.maxStock || 10;
  const isOutOfStock = item.maxStock !== undefined && item.maxStock <= 0;
  const isMaxReached = item.quantity >= maxLimit;

  const productId = item.productId || item.id;
  const variantId = item.variantId;
  const isProdWishlisted = Boolean(productId && isWishlisted(productId, variantId));
  const isIdWishlisted = Boolean(item.id && isWishlisted(item.id, variantId));
  const wishlisted = isProdWishlisted || isIdWishlisted;
  const targetWishlistId = isProdWishlisted ? productId : isIdWishlisted ? item.id : productId;

  useEffect(() => {
    setOptimisticWishlisted(null);
  }, [wishlisted]);

  const effectiveWishlisted = optimisticWishlisted !== null ? optimisticWishlisted : wishlisted;

  const handleToggleWishlist = async () => {
    if (isTogglingWishlist) return;
    const nextState = !effectiveWishlisted;

    setOptimisticWishlisted(nextState);
    setIsAnimating(true);
    setIsTogglingWishlist(true);

    const btn = buttonRef.current;
    if (btn) {
      popElement(btn);
      if (nextState) {
        burstHearts(btn);
      }
    }

    try {
      if (effectiveWishlisted) {
        await removeFromWishlist(targetWishlistId, variantId);
      } else {
        await addToWishlist(
          {
            id: targetWishlistId,
            variantId: variantId,
            name: item.name,
          },
          { triggerElement: btn }
        );
      }
    } catch {
      setOptimisticWishlisted(!nextState);
      toast.error(effectiveWishlisted ? "Could not remove from wishlist" : "Could not add to wishlist");
    } finally {
      setIsTogglingWishlist(false);
      setTimeout(() => {
        setIsAnimating(false);
      }, 600);
    }
  };

  const savings = mrp * item.quantity - itemTotal;

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-4 p-4 sm:p-5 rounded-3xl border transition-all duration-300 bg-white dark:bg-zinc-900 shadow-2xs hover:shadow-md",
        isOutOfStock
          ? "border-amber-200 bg-amber-50/20 dark:bg-amber-950/10"
          : "border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
        isRemoving && "opacity-50 pointer-events-none scale-[0.99]"
      )}
    >
      {/* Top Row: Image, Details & Quick Wishlist/Remove Action */}
      <div className="flex items-start gap-4">
        {/* Product Image Container with floating discount tag */}
        <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 p-2 flex items-center justify-center">
          <SafeImage
            src={item.image_url}
            alt={item.name}
            width={88}
            height={88}
            className={cn(
              "h-full w-full object-contain transition-transform duration-300 group-hover:scale-105",
              isOutOfStock && "grayscale opacity-60"
            )}
          />
          {discountPercent > 0 && (
            <span className="absolute -top-1 -left-1 rounded-br-xl bg-emerald-600 px-2 py-0.5 text-[9px] font-normal text-white shadow-2xs">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Title, Unit & Pricing metadata */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm sm:text-base font-normal text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
              {item.name}
            </h3>

            {/* Top right quick actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                ref={buttonRef}
                type="button"
                onClick={handleToggleWishlist}
                title={effectiveWishlisted ? "Remove from wishlist" : "Save to wishlist"}
                className={cn(
                  "relative p-1.5 rounded-xl transition-all cursor-pointer active:scale-95",
                  effectiveWishlisted ? "text-rose-500 bg-rose-50 dark:bg-rose-950/40" : "text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                {isAnimating && effectiveWishlisted && (
                  <span className="pointer-events-none absolute inset-0 rounded-xl bg-rose-400/30 animate-heart-ring" />
                )}
                <Heart className={cn("h-4 w-4", effectiveWishlisted && "fill-rose-500")} />
              </button>

              <button
                type="button"
                onClick={() => onRemoveItem(identifier)}
                disabled={isRemoving}
                title="Remove item"
                className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all active:scale-95 cursor-pointer"
              >
                {isRemoving ? (
                  <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {item.unit && (
              <span className="inline-block rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                {item.unit}
              </span>
            )}
            {isOutOfStock && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 text-[10px] font-normal text-rose-600 border border-rose-200/50">
                <AlertCircle className="h-3 w-3" />
                Out of Stock
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-sm sm:text-base font-normal text-zinc-900 dark:text-zinc-100">
              {formatCurrency(unitPrice)}
            </span>
            {mrp > unitPrice && (
              <span className="text-xs font-normal text-zinc-400 line-through">
                {formatCurrency(mrp)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar: Quantity Controls & Total Cost Box */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">

        {/* Quantity Incremental Pill */}
        <div className="flex items-center rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 p-1 border border-zinc-200/60 dark:border-zinc-700/50">
          <button
            type="button"
            disabled={isUpdating || isRemoving}
            onClick={() => {
              if (item.quantity <= 1) {
                onRemoveItem(identifier);
              } else {
                onUpdateQuantity(identifier, item.quantity - 1);
              }
            }}
            aria-label="Decrease quantity"
            className="flex h-7 w-7 items-center justify-center rounded-xl bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 shadow-2xs transition-all hover:bg-zinc-50 active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            {item.quantity <= 1 ? <Trash2 className="h-3.5 w-3.5 text-rose-500" /> : <Minus className="h-3.5 w-3.5" />}
          </button>

          <span className="w-9 text-center text-xs sm:text-sm font-normal text-zinc-900 dark:text-zinc-100 tabular-nums">
            {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto text-zinc-500" /> : item.quantity}
          </span>

          <button
            type="button"
            disabled={isUpdating || isRemoving || isOutOfStock || isMaxReached}
            onClick={() => onUpdateQuantity(identifier, item.quantity + 1)}
            aria-label="Increase quantity"
            className="flex h-7 w-7 items-center justify-center rounded-xl bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 shadow-2xs transition-all hover:bg-zinc-50 active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Max Stock / Savings Warnings */}
        <div className="flex flex-col items-end">
          {isMaxReached && !isOutOfStock && (
            <span className="text-[10px] font-normal text-amber-600 dark:text-amber-400">
              Max limit reached
            </span>
          )}
          {savings > 0 && (
            <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">
              Saved {formatCurrency(savings)}
            </span>
          )}
        </div>

        {/* Total Price Display */}
        <div className="text-right">
          <div className="text-sm sm:text-base font-normal text-zinc-900 dark:text-zinc-100 tabular-nums">
            {formatCurrency(itemTotal)}
          </div>
        </div>

      </div>
    </div>
  );
}