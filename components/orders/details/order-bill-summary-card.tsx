"use client";

import React from "react";
import { Receipt, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface OrderBillSummaryCardProps {
  subtotal: number;
  shippingTotal: number;
  discountTotal: number;
  taxTotal: number;
  totalAmount: number;
}

export function OrderBillSummaryCard({
  subtotal,
  shippingTotal,
  discountTotal,
  taxTotal,
  totalAmount,
}: OrderBillSummaryCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-2xs transition-all hover:border-gray-200">
      <div>
        {/* Header */}
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100">
          <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Receipt className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-gray-900">
            Bill Summary
          </h4>
        </div>

        {/* Breakdown */}
        <dl className="space-y-2.5 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <dt>Items Subtotal</dt>
            <dd className="font-semibold text-gray-900 tabular-nums">
              {formatCurrency(subtotal)}
            </dd>
          </div>

          <div className="flex items-center justify-between">
            <dt>Delivery Charge</dt>
            <dd className="font-bold tabular-nums">
              {shippingTotal > 0 ? (
                <span className="text-gray-900">{formatCurrency(shippingTotal)}</span>
              ) : (
                <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[11px] font-bold">
                  FREE
                </span>
              )}
            </dd>
          </div>

          {discountTotal > 0 && (
            <div className="flex items-center justify-between text-emerald-700 font-medium">
              <dt className="flex items-center gap-1">
                <span>Savings & Discount</span>
              </dt>
              <dd className="font-bold tabular-nums">
                -{formatCurrency(discountTotal)}
              </dd>
            </div>
          )}

          {taxTotal > 0 && (
            <div className="flex items-center justify-between">
              <dt>Taxes & GST</dt>
              <dd className="font-semibold text-gray-900 tabular-nums">
                {formatCurrency(taxTotal)}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Total Paid */}
      <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-900">Total Paid</span>
            <span className="block text-[10px] text-gray-500 font-normal">
              Inclusive of all taxes
            </span>
          </div>
          <span className="text-base sm:text-lg font-extrabold text-gray-900 tabular-nums">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        {discountTotal > 0 && (
          <div className="mt-2.5 rounded-lg bg-emerald-50/80 border border-emerald-100 px-2.5 py-1.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-800">
            <Sparkles className="h-3 w-3 text-emerald-600" />
            <span>You saved {formatCurrency(discountTotal)} on this order!</span>
          </div>
        )}
      </div>
    </div>
  );
}

