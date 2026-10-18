"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, Package } from "lucide-react";
import { Product } from "@/types/product";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";

export function ProductCard({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  const { items, addToCart, updateQuantity } = useCart();

  const cartItem = items.find(
    (item) => item.productId === product.id || item.id === product.id || (item.variantId && item.variantId === (product as any).variantId)
  );
  const quantity = cartItem?.quantity || 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock <= 0 || product.isAvailable === false) {
      toast.error("Product is currently out of stock");
      return;
    }

    addToCart(product, 1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (quantity >= product.stock) {
      toast.error(`Only ${product.stock} items available in stock`);
      return;
    }

    if (cartItem) {
      updateQuantity(cartItem.cartItemId || cartItem.id, quantity + 1);
    } else {
      addToCart(product, 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (cartItem) {
      updateQuantity(cartItem.cartItemId || cartItem.id, quantity - 1);
    }
  };

  const [imageError, setImageError] = useState(false);

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

  return (
    <div
      className={`group relative flex flex-col w-full max-w-[138px] bg-transparent select-none ${className}`}
    >
      {/* 1. Dedicated Image Box: Reduced compact size with rounded border */}
      <div className="relative aspect-square w-full rounded-xl border border-slate-200/90 bg-white p-1.5 flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:border-slate-300 group-hover:shadow-xs">
        <Link
          href={`/product/${product.slug}`}
          className="relative w-full h-full flex items-center justify-center cursor-pointer"
        >
          {shouldShowImage ? (
            <Image
              src={cleanImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 115px, 135px"
              className="object-contain p-0.5 transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full rounded-lg bg-slate-50/80 p-1 text-center select-none group-hover:bg-slate-100/80 transition-colors">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 stroke-[1.75]" />
              </div>
              <span className="mt-0.5 text-[8.5px] font-black uppercase tracking-wider text-slate-400 line-clamp-1 max-w-[85%]">
                {product.brand || product.category_name || "Tiding"}
              </span>
            </div>
          )}
        </Link>

        {/* Floating Bottom-Right ADD Badge / Stepper inside image box */}
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute right-1.5 bottom-1.5 z-10"
        >
          {quantity === 0 ? (
            <button
              onClick={handleAddToCart}
              className="group/btn flex items-center justify-center gap-1.5 bg-white hover:bg-[#18A818] border-2 border-[#18A818] text-[#18A818] hover:text-white px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer leading-none min-w-[72px] sm:min-w-[80px] h-7.5 sm:h-8.5"
            >
              <span>ADD</span>
              <Plus className="h-3.5 w-3.5 stroke-[3] group-hover/btn:rotate-90 transition-transform duration-200" />
            </button>
          ) : (
            <div className="flex items-center rounded-xl bg-[#18A818] text-white shadow-md overflow-hidden text-xs sm:text-sm font-black leading-none h-7.5 sm:h-8.5 min-w-[76px] sm:min-w-[84px]">
              <button
                onClick={handleDecrement}
                aria-label="Decrease quantity"
                className="flex h-7.5 w-6.5 sm:h-8.5 sm:w-7.5 items-center justify-center hover:bg-[#148F14] transition-colors active:scale-90 cursor-pointer"
              >
                <Minus className="h-3 w-3 stroke-[3]" />
              </button>
              <span className="flex-1 text-center text-xs sm:text-sm font-black select-none px-1">
                {quantity}
              </span>
              <button
                onClick={handleIncrement}
                aria-label="Increase quantity"
                className="flex h-7.5 w-6.5 sm:h-8.5 sm:w-7.5 items-center justify-center hover:bg-[#148F14] transition-colors active:scale-90 cursor-pointer"
              >
                <Plus className="h-3 w-3 stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Content Details: NO outer box, clean compact text underneath */}
      <div className="flex flex-col pt-1.5 px-0.5">
        {/* Price Row: Big size price in GREEN color */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[13.5px] sm:text-[14.5px] md:text-[17.5px] font-black text-[#18A818] tracking-tight leading-none">
            {formatCurrency(product.price)}
          </span>
          {product.mrp > product.price && (
            <span className="text-[10px] text-slate-400 line-through font-normal leading-none">
              {formatCurrency(product.mrp)}
            </span>
          )}
        </div>

        {/* Product Title */}
        <Link
          href={`/product/${product.slug}`}
          title={product.name}
          className="text-[11px] sm:text-xs font-semibold text-slate-800 line-clamp-2 leading-tight mt-1 hover:text-[#18A818] transition-colors cursor-pointer"
        >
          {product.name}
        </Link>

        {/* Pack Size / Unit */}
        <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
          {product.unit
            ? product.unit.toLowerCase().includes("pack")
              ? product.unit
              : `1 pack (${product.unit})`
            : "1 pack"}
        </p>
      </div>
    </div>
  );
}
