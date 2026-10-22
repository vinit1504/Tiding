"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TicketPercent,
  Copy,
  Check,
  Clock,
  ArrowRight,
  BadgePercent,
  CheckCircle2,
  AlertCircle,
  History,
  Tag,
  Loader2,
} from "lucide-react";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { useCouponsQuery, useMyCouponUsagesQuery } from "@/queries/coupon/use-coupon-queries";
import { useValidateCouponMutation } from "@/queries/coupon/use-coupon-mutations";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CouponRecord } from "@/types/coupon";

export default function OffersPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [applyingCode, setApplyingCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"coupons" | "history">("coupons");

  const { items, bill, appliedCoupon, applyCoupon, removeCoupon } = useCart();
  const { data: couponsData, isLoading: isLoadingCoupons } = useCouponsQuery();
  const { data: usagesData, isLoading: isLoadingUsages } = useMyCouponUsagesQuery();
  const validateMutation = useValidateCouponMutation();

  const coupons = couponsData?.coupons || [];
  const usages = usagesData?.usages || [];

  const handleCopyCode = (code: string) => {
    if (typeof navigator !== "undefined" && navigator?.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    toast.success(`Coupon code ${code} copied to clipboard!`);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  const handleApplyCoupon = async (coupon: CouponRecord) => {
    setApplyingCode(coupon.code);
    try {
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

      await applyCoupon(coupon.code);
      toast.success(`Applied ${coupon.code} to your cart!`);
    } catch (err: any) {
      toast.error(err?.message || `Failed to apply ${coupon.code}`);
    } finally {
      setApplyingCode(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f4f6fb] py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-6 items-start">
        {/* Left Sidebar */}
        <AccountSidebar activeTab="offers" />

        {/* Right Content Panel */}
        <main className="flex-1 w-full bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Coupons & Promotions
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Apply these coupons at cart or checkout to get instant discounts on your grocery orders
              </p>
            </div>

            {/* Tab switch */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("coupons")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "coupons"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Active Coupons ({coupons.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "history"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Redemption History
              </button>
            </div>
          </div>

          {activeTab === "coupons" && (
            <>
              {/* Promo Announcement Box */}
              <div className="rounded-xl border border-gray-200/80 bg-gray-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <BadgePercent className="h-4.5 w-4.5 text-[#0c831f]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Save extra with Storefront Coupons
                    </p>
                    <p className="text-xs text-gray-500">
                      Tap &quot;Apply to Cart&quot; on any eligible coupon to redeem instantly, or copy the code.
                    </p>
                  </div>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0c831f] hover:underline shrink-0 self-start sm:self-auto"
                >
                  <span>Start Shopping</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Coupon Cards List */}
              <div className="space-y-4">
                {isLoadingCoupons ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
                    ))}
                  </div>
                ) : coupons.length > 0 ? (
                  coupons.map((coupon) => {
                    const isCopied = copiedCode === coupon.code;
                    const isCurrentApplied = appliedCoupon?.code?.toUpperCase() === coupon.code.toUpperCase();
                    const minAmount = Number(coupon.min_cart_amount || 0);
                    const isMinReached = bill.itemTotal >= minAmount;
                    const diffToUnlock = Math.max(0, minAmount - bill.itemTotal);

                    const discountDisplay =
                      coupon.discount_type === "PERCENTAGE"
                        ? `${coupon.discount_value}% OFF`
                        : `FLAT ${formatCurrency(Number(coupon.discount_value))} OFF`;

                    return (
                      <div
                        key={coupon.id}
                        className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isCurrentApplied
                            ? "border-[#0c831f] bg-emerald-50/20"
                            : "border-gray-200/80 hover:border-[#0c831f]/50 bg-white"
                        }`}
                      >
                        {/* Left Details */}
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                            <Tag className="h-6 w-6 text-[#0c831f]" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                {discountDisplay}
                              </span>
                              {coupon.usage_limit_per_user_per_month > 1 && (
                                <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                  {coupon.usage_limit_per_user_per_month} uses/month
                                </span>
                              )}
                              <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Expires {new Date(coupon.end_date).toLocaleDateString()}</span>
                              </span>
                            </div>

                            <h3 className="text-sm sm:text-base font-bold text-gray-900">
                              {coupon.name}
                            </h3>
                            <p className="text-xs text-gray-500 max-w-lg leading-relaxed">
                              {coupon.description}
                            </p>

                            <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
                              <span>
                                Min basket: <strong className="text-gray-800 font-bold">{formatCurrency(minAmount)}</strong>
                              </span>
                              {coupon.max_discount_amount && (
                                <>
                                  <span>•</span>
                                  <span>
                                    Max savings: <strong className="text-gray-800 font-bold">{formatCurrency(Number(coupon.max_discount_amount))}</strong>
                                  </span>
                                </>
                              )}
                            </div>

                            {!isMinReached && bill.itemTotal > 0 && (
                              <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block font-semibold mt-1">
                                Add {formatCurrency(diffToUnlock)} more to basket to apply
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Code & Apply Actions */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0">
                          <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#0c831f]/50 bg-emerald-50/50 px-3 py-1.5">
                            <span className="font-mono text-xs sm:text-sm font-black tracking-wider text-[#0c831f]">
                              {coupon.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(coupon.code)}
                              className="text-gray-400 hover:text-gray-700 transition-colors p-0.5"
                              title="Copy promo code"
                            >
                              {isCopied ? (
                                <Check className="h-3.5 w-3.5 text-[#0c831f]" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>

                          {isCurrentApplied ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 text-[#0c831f] text-xs font-bold">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Applied in Cart</span>
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleApplyCoupon(coupon)}
                              disabled={applyingCode === coupon.code || (!isMinReached && bill.itemTotal > 0)}
                              className={`text-xs font-bold shadow-xs h-8 px-3.5 ${
                                isMinReached || bill.itemTotal === 0
                                  ? "bg-[#0c831f] hover:bg-[#0a6e1a] text-white"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              {applyingCode === coupon.code ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                "Apply to Cart"
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-16 text-center space-y-2">
                    <Tag className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="text-sm font-bold text-gray-800">No active coupons</p>
                    <p className="text-xs text-gray-500">Check back soon for seasonal savings!</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800">
                Your Past Coupon Redemptions
              </h3>

              {isLoadingUsages ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : usages.length > 0 ? (
                <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-xs">
                  {usages.map((usage) => (
                    <div key={usage.id} className="p-4 flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-[#0c831f] text-sm">
                            {usage.code || "COUPON"}
                          </span>
                          {usage.order_id && (
                            <span className="text-[11px] text-gray-500">
                              Order #{String(usage.order_id).slice(-8)}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400">
                          Redeemed on {new Date(usage.used_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right space-y-0.5">
                        <span className="font-black text-sm text-[#0c831f]">
                          Saved {formatCurrency(Number(usage.discount_amount))}
                        </span>
                        <p className="text-[11px] text-gray-500">
                          Order Value: {formatCurrency(Number(usage.order_amount))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                    <History className="h-7 w-7 stroke-[1.5]" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">
                    No redemption history found
                  </h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    When you redeem discount coupons on orders, your total savings and history will appear here.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
