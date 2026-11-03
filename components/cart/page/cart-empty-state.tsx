"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CartEmptyState() {
  return (
    <div className="py-16 sm:py-24 text-center max-w-md mx-auto space-y-5 px-4">
      <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/20 shadow-sm">
        <ShoppingBag className="h-12 w-12 stroke-[1.5]" />
        <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-xs">
          <Sparkles className="h-4 w-4" />
        </span>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
          Your cart is empty
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
          Looks like you haven&apos;t added anything to your cart yet. Explore our fresh groceries, dairy, snacks, and daily essentials delivered in 15 minutes!
        </p>
      </div>

      <Link href="/" className="inline-block pt-2">
        <Button
          size="lg"
          className="h-12 px-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black text-sm rounded-xl gap-2 shadow-sm shadow-[var(--primary)]/25 cursor-pointer active:scale-95 transition-all"
        >
          <span>Start Shopping</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
