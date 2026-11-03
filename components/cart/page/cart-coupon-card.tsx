"use client";

import React, { useState } from "react";
import { Tag, CheckCircle2, X, Loader2, ChevronRight, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { CouponSheet } from "@/components/cart/coupon-sheet";

interface CartCouponCardProps {
  appliedCoupon: {
    code: string;
    discount: number;
    description?: string;
  } | null;
  onApplyCoupon: (code: string) => Promise<void> | void;
  onRemoveCoupon: () => void;
  cartTotal: number;
}

export function CartCouponCard({
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  cartTotal,
}: CartCouponCardProps) {
  const [couponInput, setCouponInput] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleApply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      toast.error("Please enter a valid coupon code");
      return;
    }

    setIsApplying(true);
    try {
      await onApplyCoupon(code);
      setCouponInput("");
    } catch {
      // toast is handled in parent / hook
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-xs">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
              <Tag className="h-4 w-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-normal tracking-tight text-zinc-900 dark:text-zinc-100">
              Coupons & Offers
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setIsSheetOpen(true)}
            className="group inline-flex cursor-pointer items-center gap-1 rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-normal text-[var(--primary)] hover:bg-[var(--primary)]/15 transition-all active:scale-95"
          >
            <span>View All</span>
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {appliedCoupon ? (
            /* ───────── Applied coupon: ticket layout ───────── */
            <div className="relative flex overflow-hidden rounded-xl border border-[var(--primary)]/30 bg-white dark:bg-zinc-900 shadow-2xs">
              {/* Left stub */}
              <div className="flex w-24 shrink-0 flex-col items-center justify-center gap-1 bg-[var(--primary)] px-2 py-4 text-center text-white sm:w-28">
                <CheckCircle2 className="h-4.5 w-4.5" />
                <span className="text-[10px] font-normal uppercase tracking-wider text-emerald-100">
                  You saved
                </span>
                <span className="text-base font-normal leading-none tabular-nums sm:text-lg">
                  {formatCurrency(appliedCoupon.discount)}
                </span>
              </div>

              {/* Perforated divider */}
              <div className="relative w-0 self-stretch border-l-2 border-dashed border-[var(--primary)]/30">
                <span className="absolute -left-[9px] -top-2 h-4 w-4 rounded-full border border-[var(--primary)]/30 bg-white dark:bg-zinc-900" />
                <span className="absolute -bottom-2 -left-[9px] h-4 w-4 rounded-full border border-[var(--primary)]/30 bg-white dark:bg-zinc-900" />
              </div>

              {/* Right content */}
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3 bg-[var(--primary)]/5 p-3.5 pl-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-dashed border-[var(--primary)]/50 bg-white dark:bg-zinc-800 px-2 py-0.5 text-xs font-normal uppercase tracking-wider text-[var(--primary)]">
                      {appliedCoupon.code}
                    </span>
                    <span className="rounded-md bg-[var(--primary)] px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide text-white">
                      Applied
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs font-normal text-zinc-600 dark:text-zinc-300">
                    {appliedCoupon.description ||
                      "Coupon applied successfully on your order."}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemoveCoupon}
                  aria-label="Remove coupon"
                  className="h-8 shrink-0 cursor-pointer gap-1 rounded-lg px-2 text-xs font-normal text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 active:scale-95"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Remove</span>
                </Button>
              </div>
            </div>
          ) : (
            /* ───────── Enter coupon: dashed coupon slip ───────── */
            <form
              onSubmit={handleApply}
              className="relative flex items-center gap-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-800/40 p-2 transition-colors focus-within:border-[var(--primary)] focus-within:bg-white dark:focus-within:bg-zinc-900"
            >
              {/* Scissors cut mark */}
              <Scissors className="absolute -top-2.5 left-4 h-4 w-4 rotate-0 bg-white dark:bg-zinc-900 px-0.5 text-[var(--primary)]" />

              <div className="relative flex-1">
                <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="h-9 w-full rounded-lg bg-transparent pl-9 pr-2 text-xs sm:text-sm font-normal uppercase tracking-wider text-zinc-900 dark:text-zinc-100 placeholder:text-xs placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-400 focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isApplying || !couponInput.trim()}
                className="h-9 min-w-[76px] shrink-0 cursor-pointer rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 text-xs sm:text-sm font-normal text-white shadow-2xs transition-all active:scale-95 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400"
              >
                {isApplying ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Apply"
                )}
              </Button>
            </form>
          )}

          {/* Helper text */}
          {!appliedCoupon && (
            <p className="mt-3 text-xs font-normal text-zinc-500 dark:text-zinc-400">
              Apply available coupons to save up to 20% on fresh produce.
            </p>
          )}
        </div>
      </div>

      <CouponSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </>
  );
}