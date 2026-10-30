"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Minus,
  Package,
  Timer,
  Star,
  Flame,
  Sparkles,
  Heart,
  BellRing,
  Check,
} from "lucide-react";
import { Product } from "@/types/product";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import {
  popElement,
  burstHearts,
  flyHeartToHeader,
} from "@/lib/utils/wishlist-animation";

// Optional fields. Change the names here if your API uses different ones.
type ExtraProductFields = {
  rating?: number;
  average_rating?: number;
  reviews_count?: number;
  review_count?: number;
  is_veg?: boolean;
  is_bestseller?: boolean;
  is_new?: boolean;
  max_order_quantity?: number;
};

export interface ProductCardProps {
  product: Product;
  className?: string;
  cartQuantity?: number;
  deliveryEtaMinutes?: number;
  isWishlisted?: boolean;
  onAddToCart?: (variantId?: string) => void;
  onUpdateQuantity?: (variantId: string | undefined, newQuantity: number) => void;
  onToggleWishlist?: (product: Product, next: boolean) => void;
  onNotifyMe?: (product: Product) => void;
}

const compact = new Intl.NumberFormat("en-IN", { notation: "compact" });

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function ProductCardSkeleton() {
  return (
    <div className="w-full animate-pulse rounded-2xl border border-slate-200 bg-white p-2">
      <div className="aspect-square w-full rounded-xl bg-slate-200/70" />
      <div className="mt-3 h-2.5 w-14 rounded bg-slate-200/70" />
      <div className="mt-2 h-3.5 w-3/4 rounded bg-slate-200/70" />
      <div className="mt-1.5 h-3 w-1/3 rounded bg-slate-200/70" />
      <div className="mt-4 flex items-end justify-between">
        <div className="space-y-1.5">
          <div className="h-4 w-10 rounded bg-slate-200/70" />
          <div className="h-3 w-8 rounded bg-slate-200/70" />
        </div>
        <div className="h-8 w-[72px] rounded-lg bg-slate-200/70" />
      </div>
    </div>
  );
}

export function ProductCard({
  product,
  className = "",
  cartQuantity,
  deliveryEtaMinutes,
  isWishlisted,
  onAddToCart,
  onUpdateQuantity,
  onToggleWishlist,
  onNotifyMe,
}: ProductCardProps) {
  const [mounted, setMounted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [wished, setWished] = useState(!!isWishlisted);
  const [notified, setNotified] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const heartRef = useRef<HTMLButtonElement>(null);
  const bellRef = useRef<HTMLSpanElement>(null);
  const qtyRef = useRef<HTMLSpanElement>(null);
  const firstQty = useRef(true);

  const { items, addToCart, updateQuantity } = useCart();
  const { isWishlisted: checkWishlist, toggleWishlist: triggerWishlist } = useWishlist();

  useEffect(() => {
    setMounted(true);
    if (!reduceMotion()) {
      rootRef.current?.animate(
        [
          { opacity: 0, transform: "translateY(12px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 380, easing: "cubic-bezier(.2,.8,.3,1)", fill: "backwards" }
      );
    }
  }, []);

  const p = product as Product & ExtraProductFields;

  // 1. Variant & stock
  const variantsList = Array.isArray(product.variants) ? product.variants : [];
  const activeVariant = product.default_variant || variantsList[0] || null;
  const variantId = activeVariant?.id;
  const extraOptions = variantsList.length > 1 ? variantsList.length : 0;

  const isWishedGlobal = typeof isWishlisted === "boolean"
    ? isWishlisted
    : checkWishlist(product.id, variantId);

  useEffect(() => {
    setWished(isWishedGlobal);
  }, [isWishedGlobal]);

  const rawStock =
    activeVariant?.stock_quantity ?? product.stock_quantity ?? product.stock;
  const availableStock =
    typeof rawStock === "number" && !isNaN(rawStock)
      ? Math.max(0, rawStock)
      : Infinity;

  const maxQty = Math.min(
    availableStock,
    typeof p.max_order_quantity === "number" && p.max_order_quantity > 0
      ? p.max_order_quantity
      : Infinity
  );

  const isOutOfStock =
    activeVariant?.is_in_stock === false ||
    activeVariant?.is_available === false ||
    product.isAvailable === false ||
    product.is_in_stock === false ||
    availableStock <= 0;

  const isLowStock =
    !isOutOfStock && Number.isFinite(availableStock) && availableStock <= 5;

  // 2. Cart quantity
  const cartItem = items.find(
    (item) =>
      item.productId === product.id ||
      item.id === product.id ||
      (variantId && item.variantId === variantId)
  );

  const resolvedCartQuantity =
    typeof cartQuantity === "number" ? cartQuantity : cartItem?.quantity || 0;

  const displayQuantity = mounted ? resolvedCartQuantity : 0;
  const isAtLimit = displayQuantity >= maxQty;

  useEffect(() => {
    if (firstQty.current) {
      firstQty.current = false;
      return;
    }
    if (reduceMotion()) return;
    qtyRef.current?.animate(
      [
        { transform: "scale(0.5)", opacity: 0.4 },
        { transform: "scale(1.3)", offset: 0.6 },
        { transform: "scale(1)", opacity: 1 },
      ],
      { duration: 220, easing: "ease-out" }
    );
  }, [displayQuantity]);

  // 3. Handlers
  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    stop(e);
    if (isOutOfStock) {
      toast.error("This product is currently out of stock");
      return;
    }
    if (onAddToCart) onAddToCart(variantId);
    else addToCart(product, 1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    stop(e);
    if (isOutOfStock) {
      toast.error("This product is currently out of stock");
      return;
    }
    if (isAtLimit) {
      toast.error(
        `You can add only ${maxQty} ${maxQty === 1 ? "item" : "items"} of this product`
      );
      return;
    }
    const nextQty = resolvedCartQuantity + 1;
    if (onUpdateQuantity) onUpdateQuantity(variantId, nextQty);
    else if (cartItem) updateQuantity(cartItem.cartItemId || cartItem.id, nextQty);
    else addToCart(product, 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    stop(e);
    const nextQty = Math.max(0, resolvedCartQuantity - 1);
    if (onUpdateQuantity) onUpdateQuantity(variantId, nextQty);
    else if (cartItem) updateQuantity(cartItem.cartItemId || cartItem.id, nextQty);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    stop(e);
    const next = !wished;
    setWished(next);

    const btn = heartRef.current;
    if (btn) {
      popElement(btn);
      if (next) {
        burstHearts(btn);
      }
    }

    if (onToggleWishlist) {
      onToggleWishlist(product, next);
    } else {
      triggerWishlist(
        { id: product.id, variantId, name: product.name },
        btn
      );
    }
  };

  const handleNotify = (e: React.MouseEvent) => {
    stop(e);
    if (notified) return;
    setNotified(true);
    onNotifyMe?.(product);

    if (!reduceMotion()) {
      bellRef.current?.animate(
        [
          { transform: "rotate(0)" },
          { transform: "rotate(-25deg)", offset: 0.2 },
          { transform: "rotate(20deg)", offset: 0.4 },
          { transform: "rotate(-14deg)", offset: 0.6 },
          { transform: "rotate(8deg)", offset: 0.8 },
          { transform: "rotate(0)" },
        ],
        { duration: 600, easing: "ease-in-out" }
      );
    }
    toast.success("We'll let you know when it's back");
  };

  // 4. Image
  const cleanImage =
    product.image_url && product.image_url.trim() !== ""
      ? product.image_url.trim()
      : Array.isArray(product.images) && product.images.length > 0
        ? typeof product.images[0] === "string"
          ? product.images[0].trim()
          : (product.images[0] as { image_url?: string })?.image_url?.trim() ||
          null
        : null;

  const shouldShowImage = cleanImage && !imageError;

  // 5. Price & offer
  const eta = deliveryEtaMinutes || product.deliveryEtaMinutes || 10;
  const hasMrp = product.mrp > product.price;
  const discountPct =
    product.discountPercentage > 0
      ? Math.round(product.discountPercentage)
      : hasMrp
        ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
        : 0;

  // Reference UI shows just the unit, e.g. "200 g"
  const unitText = product.unit || "1 pack";

  // 6. Rating & tags
  const ratingValue = Number(p.rating ?? p.average_rating ?? 0);
  const reviewCount = Number(p.reviews_count ?? p.review_count ?? 0);
  const showRating = ratingValue > 0;
  const showTag = !isOutOfStock && (p.is_bestseller || p.is_new);
  const brandName = product.brand || product.category_name || "";

  const productHref = `/product/${product.slug || product.id}${variantId ? `?variantId=${variantId}` : ""}`;

  return (
    <div
      ref={rootRef}
      className={`group relative flex w-full select-none flex-col rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition-shadow duration-300 ${
        isOutOfStock ? "" : "hover:shadow-lg hover:shadow-slate-200"
      } ${className}`}
    >
      {/* IMAGE AREA */}
      <div className="relative">
        <Link
          href={productHref}
          prefetch={false}
          className="relative block aspect-square w-full overflow-hidden rounded-xl bg-slate-50"
        >
          {shouldShowImage && !imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-slate-100" />
          )}

          {shouldShowImage ? (
            <Image
              src={cleanImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 160px, 175px"
              className={`object-cover transition-all duration-500 ${isOutOfStock
                ? "grayscale opacity-60"
                : "group-hover:scale-105"
                } ${imageLoaded ? "" : "opacity-0"}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className={`flex h-full w-full flex-col items-center justify-center bg-slate-50 text-center ${isOutOfStock ? "grayscale opacity-60" : ""
                }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200/70 text-slate-400">
                <Package className="h-5 w-5" />
              </div>
              <span className="mt-1 line-clamp-1 max-w-[85%] text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {brandName || "Tiding"}
              </span>
            </div>
          )}

          {isOutOfStock && (
            <div className="pointer-events-none absolute inset-0 bg-white/40" />
          )}

          {/* Bestseller / New tag (bottom-left of image) */}
          {showTag && (
            <span
              className={`absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-extrabold uppercase leading-none tracking-wide text-white shadow-sm ${p.is_bestseller ? "bg-orange-500" : "bg-blue-500"
                }`}
            >
              {p.is_bestseller ? (
                <>
                  <Flame className="h-2.5 w-2.5" /> Bestseller
                </>
              ) : (
                <>
                  <Sparkles className="h-2.5 w-2.5" /> New
                </>
              )}
            </span>
          )}
        </Link>

        {/* OFFER RIBBON (hangs from top-left, only when in stock) */}
        {!isOutOfStock && discountPct > 0 && (
          <div
            className="pointer-events-none absolute -top-0.5 left-2.5 z-10"
            style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.22))" }}
            aria-label={`${discountPct}% off`}
          >
            <div
              className="flex min-w-[34px] flex-col items-center bg-gradient-to-b from-[#22C322] to-[#18A818] px-1.5 pb-3.5 pt-2 leading-none text-white"
              style={{
                clipPath:
                  "polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)",
              }}
            >
              <span className="text-[13px] font-extrabold tracking-tight">
                {discountPct}%
              </span>
              <span className="mt-[3px] text-[9px] font-extrabold tracking-[0.12em]">
                OFF
              </span>
            </div>
            {/* top highlight line for a stitched look */}
            <span className="absolute inset-x-0 top-0 h-[2px] bg-white/30" />
          </div>
        )}

        {/* NOTIFY ME bell (top-left, only when out of stock) */}
        {isOutOfStock && (
          <span className="pointer-events-none absolute left-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-full bg-slate-900/90 px-2 py-[3px] text-[9px] font-bold uppercase leading-none tracking-wide text-white shadow-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            Out of stock
          </span>
        )}

        {/* WISHLIST HEART (top-right) */}
        <button
          ref={heartRef}
          onClick={handleWishlist}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className="absolute right-1.5 top-1.5 z-20 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-black/5 transition-transform hover:scale-110"
        >
          <Heart
            className={`h-3.5 w-3.5 transition-colors duration-200 ${wished ? "fill-red-500 text-red-500" : "text-slate-400"
              }`}
          />
        </button>
      </div>

      {/* DETAILS */}
      <Link
        href={productHref}
        prefetch={false}
        className="mt-2 flex cursor-pointer flex-col px-0.5"
      >
        {/* Row 1: delivery time + rating */}
        <div className="flex min-h-[16px] items-center justify-between gap-1">
          {eta > 0 && !isOutOfStock ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase leading-none tracking-wide text-slate-700">
              <Timer className="h-3 w-3 shrink-0 text-[#18A818]" />
              {eta} MINS
            </span>
          ) : (
            <span />
          )}
          {showRating && (
            <span
              className={`inline-flex shrink-0 items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-bold leading-none text-white ${isOutOfStock ? "bg-slate-400" : "bg-[#18A818]"
                }`}
            >
              <Star className="h-2.5 w-2.5 fill-white" />
              {ratingValue.toFixed(1)}
              {reviewCount > 0 && (
                <span className="font-medium opacity-90">
                  ({compact.format(reviewCount)})
                </span>
              )}
            </span>
          )}
        </div>

        {/* Row 2: name */}
        <span
          title={product.name}
          className={`mt-1.5 line-clamp-2 min-h-[36px] text-[14px] font-bold leading-[18px] transition-colors ${isOutOfStock
            ? "text-slate-500"
            : "text-slate-800 group-hover:text-[#18A818]"
            }`}
        >
          {product.name}
        </span>

        {/* Row 3: veg dot + unit */}
        <div className="mt-0.5 flex items-center gap-1.5">
          {typeof p.is_veg === "boolean" && (
            <span
              title={p.is_veg ? "Vegetarian" : "Non-vegetarian"}
              className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px] border ${p.is_veg ? "border-green-600" : "border-red-600"
                } ${isOutOfStock ? "opacity-50" : ""}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${p.is_veg ? "bg-green-600" : "bg-red-600"
                  }`}
              />
            </span>
          )}
          <p className="truncate text-[12px] font-medium text-slate-500">
            {unitText}
          </p>
        </div>
      </Link>

      {/* FOOTER: price (left) + ADD / stepper (right) */}
      <div className="mt-3 flex items-end justify-between gap-1 px-0.5 pb-0.5">
        <div className="flex min-w-0 flex-col">
          <span
            className={`text-[15px] font-extrabold leading-tight ${isOutOfStock ? "text-slate-500" : "text-green-600"
              }`}
          >
            {formatCurrency(product.price)}
          </span>
          {hasMrp && (
            <span className="text-[11px] font-medium leading-tight text-slate-400 line-through">
              {formatCurrency(product.mrp)}
            </span>
          )}
          {isLowStock && (
            <span className="mt-0.5 w-fit rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold leading-none text-amber-700">
              {availableStock} left
            </span>
          )}
        </div>

        <div onClick={stop} className="flex shrink-0 flex-col items-center">
          {isOutOfStock ? (
            <button
              onClick={handleNotify}
              disabled={notified}
              aria-label={
                notified
                  ? "You will be notified"
                  : `Notify me when ${product.name} is back`
              }
              className={`flex h-8 min-w-[72px] items-center justify-center gap-1 rounded-lg border px-2 text-[11px] font-extrabold uppercase tracking-wide transition-all duration-150 ${notified
                ? "cursor-default border-[#18A818] bg-[#18A818] text-white"
                : "cursor-pointer border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900 active:scale-95"
                }`}
            >
              {notified ? (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[3]" /> Done
                </>
              ) : (
                <>
                  <span ref={bellRef} className="inline-flex origin-top">
                    <BellRing className="h-3.5 w-3.5" />
                  </span>
                  Notify
                </>
              )}
            </button>
          ) : displayQuantity === 0 ? (
            <>
              <button
                onClick={handleAddToCart}
                aria-label={`Add ${product.name} to cart`}
                className="flex h-8 min-w-[72px] cursor-pointer items-center justify-center rounded-lg border border-[#18A818] bg-white px-3 text-[13px] font-extrabold uppercase tracking-wide text-[#18A818] transition-all duration-150 hover:bg-[#18A818] hover:text-white active:scale-90"
              >
                ADD
              </button>
              {extraOptions > 0 && (
                <span className="mt-0.5 text-[8px] font-semibold leading-tight text-slate-500">
                  {extraOptions} options
                </span>
              )}
            </>
          ) : (
            <div className="flex h-8 min-w-[80px] items-center overflow-hidden rounded-lg bg-[#18A818] text-white shadow-sm">
              <button
                onClick={handleDecrement}
                aria-label="Decrease quantity"
                className="flex h-full w-7 cursor-pointer items-center justify-center transition-colors hover:bg-[#148F14] active:scale-90"
              >
                <Minus className="h-3.5 w-3.5 stroke-[3]" />
              </button>
              <span
                ref={qtyRef}
                className="flex-1 px-1 text-center text-[13px] font-extrabold"
              >
                {displayQuantity}
              </span>
              <button
                onClick={handleIncrement}
                disabled={isAtLimit}
                aria-label="Increase quantity"
                title={isAtLimit ? `Max ${maxQty} per order` : undefined}
                className={`flex h-full w-7 items-center justify-center transition-colors ${isAtLimit
                  ? "cursor-not-allowed opacity-40"
                  : "cursor-pointer hover:bg-[#148F14] active:scale-90"
                  }`}
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;