"use client";

import React from "react";
import Link from "next/link";
import { Heart, Share2, Timer } from "lucide-react";

export interface ProductHeaderProps {
  name: string;
  categoryName?: string;
  categorySlug?: string;
  brand?: string;
  isVeg?: boolean;
  deliveryEtaMinutes?: number;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onShare: () => void;
}

export function ProductHeader({
  name,
  categoryName = "Daily Essentials",
  categorySlug = "groceries",
  brand = "Tiding",
  isVeg = true,
  deliveryEtaMinutes = 8,
  isWishlisted,
  onToggleWishlist,
  onShare,
}: ProductHeaderProps) {
  return (
    <div>
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-xs font-medium text-slate-800">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span className="mx-1.5 text-slate-400">/</span>
        <Link href={`/category/${categorySlug}`} className="hover:underline">
          {categoryName}
        </Link>
        <span className="mx-1.5 text-slate-400">/</span>
        <span className="text-slate-500 truncate max-w-[200px] sm:max-w-xs inline-block align-bottom">
          {name}
        </span>
      </nav>

      {/* Title & Actions */}
      <div className="mt-3 flex items-start justify-between gap-3">
        <h1 className="text-xl font-extrabold leading-snug text-slate-900 sm:text-2xl">
          {name}
        </h1>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Wishlist Button */}
          <button
            type="button"
            onClick={onToggleWishlist}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100 transition cursor-pointer active:scale-90"
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                isWishlisted ? "fill-rose-500 text-rose-500" : "text-slate-400"
              }`}
            />
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={onShare}
            aria-label="Share product"
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100 transition cursor-pointer active:scale-90"
          >
            <Share2 className="h-[18px] w-[18px] text-slate-400 hover:text-slate-600" />
          </button>

          {/* Veg / Non-Veg Indicator */}
          <span
            title={isVeg ? "Vegetarian" : "Non-Vegetarian"}
            className={`grid h-5 w-5 place-items-center rounded-[4px] border-2 ${
              isVeg ? "border-green-700" : "border-red-600"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${isVeg ? "bg-green-700" : "bg-red-600"}`}
            />
          </span>
        </div>
      </div>

      {/* Meta: ETA + Brand */}
      <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
        <Timer className="h-3.5 w-3.5 text-slate-400" /> {deliveryEtaMinutes} MINS · {brand}
      </p>
    </div>
  );
}
