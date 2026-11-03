"use client";

import React, { useState } from "react";
import { CheckCircle2, Copy, Check, Clock } from "lucide-react";
import { toast } from "sonner";

interface OrderSuccessTopBannerProps {
  orderNumber: string;
  etaMinutes: number;
  slot?: string;
}

export function OrderSuccessTopBanner({
  orderNumber,
  etaMinutes,
  slot,
}: OrderSuccessTopBannerProps) {
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyOrderId = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(orderNumber);
      setCopiedId(true);
      toast.success("Order ID copied to clipboard!");
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="w-full bg-transparent py-4">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs transition-all">
          
          {/* Left Section: Icon & Message */}
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
              <CheckCircle2 className="h-6 w-6 stroke-[2]" />
            </div>
            
            <div className="space-y-0.5">
              <h1 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Order Placed Successfully
              </h1>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-normal">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Estimated delivery in {etaMinutes}–{etaMinutes + 5} mins
                </span>
                {slot && (
                  <>
                    <span>•</span>
                    <span>{slot}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Section: Order ID Badge */}
          <button
            type="button"
            onClick={handleCopyOrderId}
            className="inline-flex cursor-pointer items-center gap-2 self-start rounded-xl bg-zinc-100 dark:bg-zinc-800/60 px-3.5 py-2 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-200/70 dark:hover:bg-zinc-800 active:scale-95 sm:self-auto border border-zinc-200 dark:border-zinc-700/50"
            title="Copy Order ID"
          >
            <span className="text-zinc-400 dark:text-zinc-500 font-normal">Order ID</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">#{orderNumber}</span>
            <span className="ml-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
              {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </span>
          </button>

        </div>
      </div>
    </div>
  );
}