"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Minus,
  Package,
  Clock,
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
    <div className="w-full max-w-[150px] animate-pulse">
      <div className="aspect-square w-full rounded-2xl bg-slate-200/70" />
      <div className="mt-4 h-2.5 w-10 rounded bg-slate-200/70" />
      <div className="mt-2 h-3 w-full rounded bg-slate-200/70" />
      <div className="mt-1 h-3 w-2/3 rounded bg-slate-200/70" />
      <div className="mt-2 h-4 w-14 rounded bg-slate-200/70" />
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

  useEffect(() => {
    if (typeof isWishlisted === "boolean") setWished(isWishlisted);
  }, [isWishlisted]);

  const p = product as Product & ExtraProductFields;

  // 1. Variant & stock
  const variantsList = Array.isArray(product.variants) ? product.variants : [];
  const activeVariant = product.default_variant || variantsList[0] || null;
  const variantId = activeVariant?.id;
  const extraOptions = variantsList.length > 1 ? variantsList.length : 0;

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
    onToggleWishlist?.(product, next);

    const btn = heartRef.current;
    if (btn) {
      popElement(btn);
      if (next) {
        burstHearts(btn);
        flyHeartToHeader(btn);
      }
    }
    if (!next) toast("Removed from wishlist");
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

  const unitText = product.unit
    ? product.unit.toLowerCase().includes("pack")
      ? product.unit
      : `1 pack (${product.unit})`
    : "1 pack";

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
      className={`group relative flex w-full max-w-[150px] flex-col select-none ${className}`}
    >
      {/* IMAGE AREA */}
      <div className="relative">
        <Link
          href={productHref}
          className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-2 transition-all duration-300 ${isOutOfStock
              ? ""
              : "group-hover:-translate-y-1 group-hover:border-slate-300 group-hover:shadow-xl group-hover:shadow-slate-200"
            }`}
        >
          {shouldShowImage && !imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-slate-100" />
          )}

          {shouldShowImage ? (
            <Image
              src={cleanImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 130px, 150px"
              className={`object-contain p-2 mix-blend-multiply transition-all duration-500 ${isOutOfStock
                  ? "grayscale opacity-60"
                  : "group-hover:scale-110 group-hover:-rotate-1"
                } ${imageLoaded ? "" : "opacity-0"}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className={`flex h-full w-full flex-col items-center justify-center rounded-lg bg-slate-50 text-center ${isOutOfStock ? "grayscale opacity-60" : ""
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

          {/* STATUS CHIP (bottom-left). Short, so it never touches ADD */}
          {(isOutOfStock || eta > 0) && (
            <span
              className={`pointer-events-none absolute bottom-1.5 left-1.5 z-10 inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[9px] font-bold uppercase leading-none tracking-wide shadow-sm ${isOutOfStock
                  ? "max-w-[100px] bg-slate-900/90 text-white"
                  : "max-w-[60px] bg-white/95 text-slate-700 ring-1 ring-black/5"
                }`}
            >
              {isOutOfStock ? (
                <>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                  Out of stock
                </>
              ) : (
                <>
                  <Clock className="h-2.5 w-2.5 shrink-0 text-[#18A818]" />
                  {eta}m
                </>
              )}
            </span>
          )}

          {/* Bestseller / New tag (below the heart) */}
          {showTag && (
            <span
              className={`absolute right-1.5 top-9 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-extrabold uppercase leading-none tracking-wide text-white shadow-sm ${p.is_bestseller ? "bg-orange-500" : "bg-blue-500"
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

        {/* NOTIFY ME (top-left, only when out of stock) */}
        {isOutOfStock && (
          <button
            onClick={handleNotify}
            disabled={notified}
            aria-label={
              notified
                ? "You will be notified"
                : `Notify me when ${product.name} is back`
            }
            title={notified ? "We'll notify you" : "Notify me"}
            className={`absolute left-1.5 top-1.5 z-20 flex h-6 w-6 items-center justify-center rounded-full shadow-sm ring-1 transition-all duration-200 ${notified
                ? "cursor-default bg-[#18A818] text-white ring-[#18A818]"
                : "cursor-pointer bg-white/95 text-slate-600 ring-black/5 hover:scale-110 hover:text-slate-900 active:scale-90"
              }`}
          >
            {notified ? (
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            ) : (
              <span ref={bellRef} className="inline-flex origin-top">
                <BellRing className="h-3.5 w-3.5" />
              </span>
            )}
          </button>
        )}

        {/* RIBBON OFFER (top-left, only when in stock) */}
        {!isOutOfStock && discountPct > 0 && (
          <div
            className="pointer-events-none absolute -top-px left-2 z-10 flex flex-col items-center bg-[#18A818] px-1.5 pb-3 pt-1.5 leading-none text-white shadow-sm"
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 84%, 0 100%)" }}
          >
            <span className="text-[12px] font-extrabold">{discountPct}%</span>
            <span className="mt-0.5 text-[8px] font-bold tracking-wider">OFF</span>
          </div>
        )}

        {/* ADD / STEPPER (only when in stock) */}
        {!isOutOfStock && (
          <div
            onClick={stop}
            className="absolute -bottom-3 right-1.5 z-20 flex flex-col items-center"
          >
            {displayQuantity === 0 ? (
              <>
                <button
                  onClick={handleAddToCart}
                  aria-label={`Add ${product.name} to cart`}
                  className="flex h-[30px] min-w-[68px] cursor-pointer items-center justify-center rounded-lg border border-[#18A818] bg-white px-3 text-[13px] font-extrabold uppercase tracking-wide text-[#18A818] shadow-md transition-all duration-150 hover:bg-[#18A818] hover:text-white active:scale-90"
                >
                  ADD
                </button>
                {extraOptions > 0 && (
                  <span className="mt-0.5 rounded-full bg-white/90 px-1.5 text-[8px] font-semibold leading-tight text-slate-500">
                    {extraOptions} options
                  </span>
                )}
              </>
            ) : (
              <div className="flex h-[30px] min-w-[76px] items-center overflow-hidden rounded-lg bg-[#18A818] text-white shadow-md">
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
        )}
      </div>

      {/* DETAILS: 4 compact rows */}
      <Link
        href={productHref}
        className="flex flex-col px-0.5 pt-3.5 cursor-pointer block"
      >
        {/* Row 1: brand + rating */}
        <div className="flex min-h-[14px] items-center justify-between gap-1">
          <span className="line-clamp-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
            {brandName}
          </span>
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
          className={`mt-0.5 line-clamp-2 min-h-[30px] text-[12px] font-semibold leading-[15px] transition-colors ${isOutOfStock ? "text-slate-500" : "text-slate-800 group-hover:text-[#18A818]"
            }`}
        >
          {product.name}
        </span>

        {/* Row 3: unit + veg dot */}
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
          <p className="truncate text-[11px] font-medium text-slate-500">
            {unitText}
          </p>
        </div>

        {/* Row 4: price + low stock */}
        <div className="mt-1.5 flex items-baseline justify-between gap-1">
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            <span
              className={`text-[15px] font-extrabold leading-none ${isOutOfStock ? "text-slate-500" : "text-slate-900"
                }`}
            >
              {formatCurrency(product.price)}
            </span>
            {hasMrp && (
              <span className="text-[11px] font-medium leading-none text-slate-400 line-through">
                {formatCurrency(product.mrp)}
              </span>
            )}
          </div>
          {isLowStock && (
            <span className="shrink-0 rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold leading-none text-amber-700">
              {availableStock} left
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}

export default ProductCard;