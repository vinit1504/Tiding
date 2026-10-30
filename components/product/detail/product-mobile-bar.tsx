"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";

export interface ProductMobileBarProps {
  unitLabel: string;
  price: number;
  cartControl: React.ReactNode;
}

export function ProductMobileBar({
  unitLabel,
  price,
  cartControl,
}: ProductMobileBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] lg:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500">{unitLabel}</p>
          <p className="text-base font-extrabold text-slate-900">{formatCurrency(price)}</p>
        </div>
        <div className="ml-auto">{cartControl}</div>
      </div>
    </div>
  );
}
