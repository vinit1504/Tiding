"use client";

import React, { useState } from "react";
import { checkoutApi } from "@/lib/api/checkout-api";

export interface PriceBreakdownCardProps {
  checkout: {
    id: string;
    subtotal: number;
    shipping_total: number;
    handling_fee?: number;
    tax_total: number;
    discount_total: number;
    grand_total: number;
    coupon_code: string | null;
  };
  onCheckoutUpdated: (updatedCheckout: any) => void;
  className?: string;
}

export const PriceBreakdownCard: React.FC<PriceBreakdownCardProps> = ({
  checkout,
  onCheckoutUpdated,
  className = "",
}) => {
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await checkoutApi.applyCoupon(checkout.id, couponCode);
      onCheckoutUpdated(updated);
      setCouponCode("");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to apply coupon.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await checkoutApi.removeCoupon(checkout.id);
      onCheckoutUpdated(updated);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to remove coupon.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-neutral-800 w-full max-w-md ${className}`}>
      <h3 className="text-lg font-bold text-gray-900 dark:text-neutral-100 mb-4 pb-2 border-b border-gray-100 dark:border-neutral-800">
        Bill Details
      </h3>

      {/* Coupon Application Box */}
      <div className="mb-6">
        {checkout.coupon_code ? (
          <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold block">
                Coupon Applied
              </span>
              <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                {checkout.coupon_code}
              </span>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 block font-medium">
                Saved ₹{Number(checkout.discount_total || 0).toFixed(2)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              disabled={loading}
              className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer disabled:opacity-50"
            >
              {loading ? "Removing..." : "Remove"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="flex-1 px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs uppercase font-mono bg-transparent text-gray-900 dark:text-neutral-100 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !couponCode.trim()}
              className="px-4 py-2 bg-gray-900 hover:bg-black dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? "Applying..." : "Apply"}
            </button>
          </form>
        )}
        {error && <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>}
      </div>

      {/* Financial Rows */}
      <div className="space-y-3 text-sm text-gray-600 dark:text-neutral-400">
        <div className="flex justify-between">
          <span>Items Total</span>
          <span className="font-medium text-gray-900 dark:text-neutral-100">
            ₹{Number(checkout.subtotal || 0).toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span>Delivery Fee</span>
          {Number(checkout.shipping_total || 0) === 0 ? (
            <span className="font-bold text-emerald-600 dark:text-emerald-400">FREE</span>
          ) : (
            <span className="font-medium text-gray-900 dark:text-neutral-100">
              ₹{Number(checkout.shipping_total).toFixed(2)}
            </span>
          )}
        </div>

        {/* Store-wise Handling Charge */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <span>Handling Fee</span>
            <span
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 cursor-help"
              title="Store packaging & operational fee"
            >
              ⓘ
            </span>
          </div>
          <span className="font-medium text-gray-900 dark:text-neutral-100">
            {Number(checkout.handling_fee || 0) > 0
              ? `₹${Number(checkout.handling_fee).toFixed(2)}`
              : "₹0.00"}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <span>Taxes & GST</span>
            <span className="text-[10px] text-gray-400 block -mt-0.5">(Includes CGST + SGST)</span>
          </div>
          <span className="font-medium text-gray-900 dark:text-neutral-100">
            ₹{Number(checkout.tax_total || 0).toFixed(2)}
          </span>
        </div>

        {Number(checkout.discount_total || 0) > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
            <span>Coupon Discount</span>
            <span>-₹{Number(checkout.discount_total).toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div className="border-t border-dashed border-gray-200 dark:border-neutral-700 mt-4 pt-4 flex justify-between items-baseline">
        <div>
          <span className="text-base font-bold text-gray-900 dark:text-neutral-100 block">To Pay</span>
          <span className="text-[10px] text-gray-400">Inclusive of all taxes & charges</span>
        </div>
        <span className="text-2xl font-black text-gray-900 dark:text-neutral-100">
          ₹{Number(checkout.grand_total || 0).toFixed(2)}
        </span>
      </div>
    </div>
  );
};

