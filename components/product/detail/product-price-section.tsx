"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const GREEN = "#318616";

export interface ProductPriceSectionProps {
  unitLabel: string;
  price: number;
  mrp: number;
  discount: number;
  cartControl: React.ReactNode;
  cartQty: number;
}

export function ProductPriceSection({
  unitLabel,
  price,
  mrp,
  discount,
  cartControl,
  cartQty,
}: ProductPriceSectionProps) {
  return (
    <div className="mt-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-600">{unitLabel}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-xl font-extrabold text-slate-900 sm:text-2xl">
              {formatCurrency(price)}
            </span>
            {discount > 0 && (
              <>
                <span className="text-sm text-slate-500">
                  MRP <span className="line-through">{formatCurrency(mrp)}</span>
                </span>
                <span
                  className="rounded-md px-2 py-0.5 text-[11px] font-extrabold text-white"
                  style={{ background: `linear-gradient(135deg,#43b922,${GREEN})` }}
                >
                  {discount}% OFF
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-[10px] text-slate-500">(Inclusive of all taxes)</p>
        </div>

        {/* Desktop Cart Control */}
        <div className="hidden lg:block">{cartControl}</div>
      </div>

      {/* Desktop Quick "View Cart" banner when product is in cart */}
      {cartQty > 0 && (
        <Link
          href="/cart"
          className="mt-4 hidden w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-bold transition hover:bg-[#f1fbea] lg:flex"
          style={{ borderColor: GREEN, color: GREEN }}
        >
          <ShoppingBag className="h-4 w-4" />
          View Cart · {formatCurrency(price * cartQty)}
        </Link>
      )}
    </div>
  );
}
