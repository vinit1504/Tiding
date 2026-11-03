"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartHeaderProps {
  totalItems: number;
  deliveryEtaMinutes?: number;
}

export function CartHeader({ totalItems, deliveryEtaMinutes = 15 }: CartHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-light)]">
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] rounded-xl gap-1.5 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden xs:inline">Continue Shopping</span>
          </Button>
        </Link>
        <div className="h-4 w-px bg-[var(--border)]" />
        <div className="flex items-baseline gap-2">
          <h3 className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
            Shopping Cart
          </h3>
          <span className="text-xs sm:text-sm font-normal text-[var(--text-secondary)]">
            ({totalItems} {totalItems === 1 ? "item" : "items"})
          </span>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary-light)] border border-[var(--primary)]/25 text-[var(--brand-green-dark)] text-xs font-medium self-start sm:self-auto shadow-xs">
        <Zap className="h-3.5 w-3.5 fill-[var(--primary)] text-[var(--primary)] animate-pulse" />
        <span>Delivery in {deliveryEtaMinutes}–{deliveryEtaMinutes + 5} minutes</span>
      </div>
    </div>
  );
}