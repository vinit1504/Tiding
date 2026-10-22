"use client";

import React, { useState, useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { isCartDrawerOpenAtom, cartCountAtom, cartItemTotalAtom } from "@/stores";
import { formatCurrency } from "@/lib/utils";

export function FloatingCartBar() {
  const [mounted, setMounted] = useState(false);
  const cartCount = useAtomValue(cartCountAtom);
  const cartTotal = useAtomValue(cartItemTotalAtom);
  const [, setIsCartDrawerOpen] = useAtom(isCartDrawerOpenAtom);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || cartCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button
        onClick={() => setIsCartDrawerOpen(true)}
        className="w-full flex items-center justify-between rounded-2xl bg-[#18A818] text-white p-3.5 shadow-xl hover:bg-[#148F14] transition-all active:scale-[0.98] cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="text-left leading-tight">
            <p className="text-xs font-bold text-white/90">
              {cartCount} {cartCount === 1 ? "Item" : "Items"} in Cart
            </p>
            <p className="text-sm font-black text-white">
              {formatCurrency(cartTotal)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-bold text-xs bg-white text-[#18A818] px-3.5 py-1.5 rounded-xl shadow-xs">
          <span>View Cart</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </button>
    </div>
  );
}
