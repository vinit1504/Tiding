"use client";

import React, { useState } from "react";
import {
  Tag,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Clock,
  ChevronRight,
  History,
  Gift,
  ArrowRight,
  Loader2,
  X,
  BadgePercent,
  Percent,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useCouponsQuery, useMyCouponUsagesQuery } from "@/queries/coupon/use-coupon-queries";
import { useValidateCouponMutation } from "@/queries/coupon/use-coupon-mutations";
import { CouponRecord } from "@/types/coupon";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";

interface CouponSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CouponSheet({ open, onOpenChange }: CouponSheetProps) {
  const { items, bill, appliedCoupon, applyCoupon, removeCoupon } = useCart();
  const { data: couponsData, isLoading: isLoadingCoupons } = useCouponsQuery();
  const { data: usagesData, isLoading: isLoadingUsages } = useMyCouponUsagesQuery();
  const validateMutation = useValidateCouponMutation();

  const [activeTab, setActiveTab] = useState<"available" | "history">("available");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [validatingCode, setValidatingCode] = useState<string | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState("");

  const coupons = couponsData?.coupons || [];
  const usages = usagesData?.usages || [];

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied code "${code}" to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleApplyCouponRecord = async (coupon: CouponRecord) => {
    const minAmount = Number(coupon.min_cart_amount || 0);
    if (minAmount > 0 && bill.itemTotal < minAmount) {
      toast.error(
        `Code '${coupon.code}' requires a minimum order of ₹${minAmount}. Add ₹${minAmount - bill.itemTotal} more to apply.`
      );
      return;
    }

    setValidatingCode(coupon.code);
    try {
      // 1. Run Pre-Checkout Coupon Validation Engine
      const cartItemsPayload = items.map((it) => ({
        productId: it.productId,
        categoryId: (it as any).categoryId || "cat_general",
        quantity: it.quantity,
        unitPrice: it.price,
      }));

      const validation = await validateMutation.mutateAsync({
        code: coupon.code,
        cartTotal: bill.itemTotal,
        items: cartItemsPayload,
      });

      if (!validation.isValid) {
        toast.error(validation.message || `Coupon ${coupon.code} is not eligible`);
        return;
      }

      // 2. Apply to Cart
      await applyCoupon(coupon.code);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || `Failed to apply ${coupon.code}`);
    } finally {
      setValidatingCode(null);
    }
  };

  const handleManualApply = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualCodeInput.trim().toUpperCase();
    if (!clean) {
      toast.error("Please enter a coupon code");
      return;
    }

    const matched = coupons.find((c) => c.code.toUpperCase() === clean);
    if (matched) {
      const minAmount = Number(matched.min_cart_amount || 0);
      if (minAmount > 0 && bill.itemTotal < minAmount) {
        toast.error(
          `Code '${matched.code}' requires a minimum order of ₹${minAmount}. Add ₹${minAmount - bill.itemTotal} more to apply.`
        );
        return;
      }
    }

    setValidatingCode(clean);
    try {
      await applyCoupon(clean);
      setManualCodeInput("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || `Invalid coupon code ${clean}`);
    } finally {
      setValidatingCode(null);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="right" size="xl" className="w-full sm:max-w-xl md:w-[540px] lg:w-[580px] bg-[var(--background)] flex flex-col shadow-2xl">
        {/* Header */}
        <DrawerHeader className="border-b border-[var(--border-light)] pb-3">
          <div className="flex items-center gap-2 text-[#18A818]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#18A818]/10 text-[#18A818]">
              <Tag className="h-4 w-4" />
            </div>
            <div>
              <DrawerTitle className="text-base font-black text-[var(--text-primary)]">
                Coupons & Promotions
              </DrawerTitle>
              <DrawerDescription className="text-xs text-[var(--text-secondary)]">
                Save extra on fresh groceries and daily essentials
              </DrawerDescription>
            </div>
          </div>

          {/* Segmented Switch with Green Active State */}
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[var(--surface-secondary)] p-1.5 mt-3 border border-[var(--border-light)]">
            <button
              type="button"
              onClick={() => setActiveTab("available")}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-black rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === "available"
                  ? "bg-[#18A818] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
              }`}
            >
              <BadgePercent className={`h-4 w-4 ${activeTab === "available" ? "text-white" : "text-[#18A818]"}`} />
              <span>Available Coupons ({coupons.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-black rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === "history"
                  ? "bg-[#18A818] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
              }`}
            >
              <History className={`h-4 w-4 ${activeTab === "history" ? "text-white" : "text-[var(--text-muted)]"}`} />
              <span>My Redemptions</span>
            </button>
          </div>
        </DrawerHeader>

        {/* Body */}
        <DrawerBody className="p-4 space-y-4 overflow-y-auto flex-1">
          {activeTab === "available" && (
            <>
              {/* Manual Promo Code Input */}
              <form onSubmit={handleManualApply} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter Coupon Code"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-3 pr-8 py-2 text-xs font-bold uppercase tracking-wider placeholder:normal-case placeholder:font-normal focus:outline-none focus:border-[#18A818]"
                  />
                  {manualCodeInput && (
                    <button
                      type="button"
                      onClick={() => setManualCodeInput("")}
                      className="absolute right-2.5 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={validatingCode === manualCodeInput.trim().toUpperCase() || !manualCodeInput.trim()}
                  className="bg-[#18A818] hover:bg-[#148F14] text-white text-xs font-bold h-9 px-4 shrink-0 shadow-xs"
                >
                  {validatingCode === manualCodeInput.trim().toUpperCase() ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              </form>

              {/* Active Applied Banner */}
              {appliedCoupon && bill.couponDiscount > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-[#18A818]/10 border border-[#18A818]/30 p-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-[#18A818]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{appliedCoupon.code} is currently active</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Discount of {formatCurrency(bill.couponDiscount)} applied to your basket
                    </p>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:underline px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Coupons List */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">
                  Available Offers for You
                </p>

                {isLoadingCoupons ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-28 rounded-2xl bg-[var(--surface-secondary)] animate-pulse" />
                    ))}
                  </div>
                ) : coupons.length > 0 ? (
                  coupons.map((coupon) => {
                    const minAmount = Number(coupon.min_cart_amount || 0);
                    const isMinReached = bill.itemTotal >= minAmount;
                    const isCurrentApplied =
                      appliedCoupon?.code?.toUpperCase() === coupon.code.toUpperCase() && isMinReached;
                    const diffToUnlock = Math.max(0, minAmount - bill.itemTotal);

                    const discountDisplay =
                      coupon.discount_type === "PERCENTAGE"
                        ? `${coupon.discount_value}% OFF`
                        : `FLAT ${formatCurrency(Number(coupon.discount_value))} OFF`;

                    return (
                      <div
                        key={coupon.id}
                        className={`group relative rounded-2xl border p-4 space-y-3 transition-all ${
                          isCurrentApplied
                            ? "border-[#18A818] bg-[#18A818]/5 shadow-sm"
                            : "border-[var(--border)] bg-[var(--surface)] hover:border-[#18A818]/40"
                        }`}
                      >
                        {/* Header: Discount Badge & Apply Button */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-[#18A818] bg-[#18A818]/15 px-2.5 py-0.5 rounded-full border border-[#18A818]/25">
                              <Percent className="h-3 w-3" />
                              {discountDisplay}
                            </span>
                            <h4 className="text-xs font-bold text-[var(--text-primary)]">
                              {coupon.name}
                            </h4>
                          </div>

                          {isCurrentApplied ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-[#18A818] bg-[#18A818]/10 px-2.5 py-1 rounded-lg">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Applied
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleApplyCouponRecord(coupon)}
                              disabled={validatingCode === coupon.code || !isMinReached}
                              className={`h-7 px-3 text-xs font-bold shadow-xs ${
                                isMinReached
                                  ? "bg-[#18A818] hover:bg-[#148F14] text-white"
                                  : "bg-[var(--surface-secondary)] text-[var(--text-muted)] cursor-not-allowed"
                              }`}
                            >
                              {validatingCode === coupon.code ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Apply"
                              )}
                            </Button>
                          )}
                        </div>

                        {/* Description */}
                        {coupon.description && (
                          <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                            {coupon.description}
                          </p>
                        )}

                        {/* Code Container with Copy */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-light)] text-xs">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 rounded-md border border-dashed border-[#18A818]/50 bg-[#18A818]/10 px-2.5 py-1 font-mono text-xs font-black text-[#18A818] uppercase tracking-wider">
                              <span>{coupon.code}</span>
                            </div>
                            <button
                              onClick={(e) => handleCopyCode(coupon.code, e)}
                              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
                              title="Copy code"
                            >
                              {copiedCode === coupon.code ? (
                                <Check className="h-3.5 w-3.5 text-[#18A818]" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Quota / Expiry Info */}
                          <div className="text-[10px] text-[var(--text-muted)] text-right">
                            {coupon.usage_limit_per_user_per_month > 1 && (
                              <p className="font-semibold text-neutral-600 dark:text-neutral-300">
                                {coupon.usage_limit_per_user_per_month} uses/month
                              </p>
                            )}
                            <p>Min order: {formatCurrency(minAmount)}</p>
                          </div>
                        </div>

                        {/* Minimum Order Value Warning / Unlock message */}
                        {!isMinReached && (
                          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5 font-medium">
                            <AlertCircle className="h-3 w-3 text-amber-600 shrink-0" />
                            <span>
                              Add {formatCurrency(diffToUnlock)} more to basket to use this coupon
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center space-y-2">
                    <Tag className="mx-auto h-8 w-8 text-[var(--text-muted)]" />
                    <p className="text-xs font-bold text-[var(--text-primary)]">
                      No active coupons found
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Check back later for seasonal festive offers and discounts!
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: MY REDEMPTION HISTORY */}
          {activeTab === "history" && (
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">
                Your Past Coupon Redemptions
              </p>

              {isLoadingUsages ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 rounded-xl bg-[var(--surface-secondary)] animate-pulse" />
                  ))}
                </div>
              ) : usages.length > 0 ? (
                <div className="divide-y divide-[var(--border-light)] rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                  {usages.map((usage) => (
                    <div key={usage.id} className="p-3 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#18A818]">
                            {usage.code || "COUPON"}
                          </span>
                          {usage.order_id && (
                            <span className="text-[10px] text-[var(--text-muted)]">
                              • Order #{String(usage.order_id).slice(-6)}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          Redeemed on {new Date(usage.used_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-[#18A818]">
                          Saved {formatCurrency(Number(usage.discount_amount))}
                        </span>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          Order: {formatCurrency(Number(usage.order_amount))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center space-y-2">
                  <History className="mx-auto h-8 w-8 text-[var(--text-muted)] stroke-[1.5]" />
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    No redemption history yet
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] max-w-xs mx-auto">
                    Coupons you apply and redeem during checkout will be recorded here for your savings summary.
                  </p>
                </div>
              )}
            </div>
          )}
        </DrawerBody>

        {/* Footer */}
        <DrawerFooter className="border-t border-[var(--border-light)] p-3">
          <DrawerClose asChild>
            <Button variant="outline" size="sm" className="w-full font-bold">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
