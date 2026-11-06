"use client";

import React from "react";
import { FileText, Sparkles } from "lucide-react";
import { OrderInvoiceActions } from "@/components/orders/order-invoice-actions";

interface OrderGstBannerProps {
  orderId: string;
  orderNumber: string;
  orderStatus?: string;
  pdfUrl?: string | null;
  invoiceNumber?: string | null;
  hasPdf: boolean;
}

export function OrderGstBanner({
  orderId,
  orderNumber,
  orderStatus,
  pdfUrl,
  invoiceNumber,
  hasPdf,
}: OrderGstBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/30 p-4 sm:p-5 shadow-2xs transition-all hover:border-emerald-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
            <FileText className="h-4.5 w-4.5" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight">
                GST Tax Invoice
              </h4>

              {hasPdf ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5 rounded-md shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {invoiceNumber || "Generated"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md">
                  Ready to Generate
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
              {hasPdf
                ? `Official GST receipt for order #${orderNumber}. You can view the tax breakup or download the PDF.`
                : "Official GST invoice not generated yet. You can generate, preview, and download your GST invoice below."}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="shrink-0 pt-1 sm:pt-0">
          <OrderInvoiceActions
            orderId={orderId}
            orderNumber={invoiceNumber || orderNumber}
            orderStatus={orderStatus}
            pdfUrl={pdfUrl}
            invoiceNumber={invoiceNumber}
            showBadge={false}
          />
        </div>
      </div>
    </div>
  );
}

