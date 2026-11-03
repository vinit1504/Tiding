"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CheckoutPageHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-light)]">
      <div className="flex items-center gap-3">
        <Link href="/cart">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] rounded-xl gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Cart</span>
          </Button>
        </Link>
        <div className="h-4 w-px bg-[var(--border)]" />
        <h1 className="text-xl sm:text-2xl text-[var(--text-primary)] tracking-tight">
          Checkout
        </h1>
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--primary-light)] border border-[var(--primary)]/30 text-[var(--primary)] text-xs self-start sm:self-auto shadow-xs">
        <Lock className="h-3.5 w-3.5 text-[var(--primary)]" />
        <span>100% Secure 256-Bit SSL Checkout</span>
      </div>
    </div>
  );
}