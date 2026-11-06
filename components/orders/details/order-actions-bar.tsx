"use client";

import React from "react";
import { BackendOrder } from "@/types/order";
import { XCircle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderActionsBarProps {
  order: BackendOrder;
  isCancellable: boolean;
  cancellingOrderId: string | null;
  itemsCount: number;
  onCancelOrder: (orderId: string, e: React.MouseEvent) => void;
  onReorder: (order: BackendOrder, e: React.MouseEvent) => void;
}

export function OrderActionsBar({
  order,
  isCancellable,
  cancellingOrderId,
  itemsCount,
  onCancelOrder,
  onReorder,
}: OrderActionsBarProps) {
  const isCurrentlyCancelling = cancellingOrderId === order.id;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
      {/* Left: Cancellation option */}
      <div className="flex items-center gap-2">
        {isCancellable && (
          <button
            type="button"
            disabled={isCurrentlyCancelling}
            onClick={(e) => onCancelOrder(order.id, e)}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50/70 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCurrentlyCancelling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-rose-500 group-hover:text-rose-600 transition-colors" />
            )}
            <span>{isCurrentlyCancelling ? "Cancelling..." : "Cancel Order"}</span>
          </button>
        )}
      </div>

      {/* Right: Reorder Button */}
      <Button
        size="sm"
        onClick={(e) => onReorder(order, e)}
        className="bg-[#0c831f] hover:bg-[#0a6f1a] active:scale-[0.98] text-white text-xs font-bold px-5 h-9 rounded-xl cursor-pointer shadow-xs transition-all flex items-center gap-2"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        <span>Reorder</span>
        {itemsCount > 0 && (
          <span className="bg-white/20 text-white text-[11px] px-1.5 py-0.2 rounded-full font-medium">
            {itemsCount}
          </span>
        )}
      </Button>
    </div>
  );
}

