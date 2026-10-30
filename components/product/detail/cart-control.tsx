"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";

export interface CartControlProps {
  available: boolean;
  cartQty: number;
  maxQty: number;
  onAdd: () => void;
  onInc: () => void;
  onDec: () => void;
  className?: string;
  size?: "default" | "sm";
}

const GREEN = "#318616";
const GREEN_HOVER = "#2a7312";

/**
 * Reusable Cart Control: renders Out of Stock button, ADD button, or -/Qty/+ stepper
 */
export function CartControl({
  available,
  cartQty,
  maxQty,
  onAdd,
  onInc,
  onDec,
  className = "",
  size = "default",
}: CartControlProps) {
  const isSm = size === "sm";
  const btnHeight = isSm ? "h-9" : "h-11";
  const btnWidth = isSm ? "w-28" : "w-36";

  if (!available) {
    return (
      <button
        disabled
        className={`${btnHeight} ${btnWidth} cursor-not-allowed rounded-lg bg-slate-200 text-xs font-bold text-slate-500 ${className}`}
      >
        Out of Stock
      </button>
    );
  }

  if (cartQty === 0) {
    return (
      <button
        type="button"
        onClick={onAdd}
        className={`${btnHeight} ${btnWidth} cursor-pointer rounded-lg text-sm font-extrabold text-white shadow-sm transition active:scale-95 ${className}`}
        style={{ background: GREEN }}
        onMouseEnter={(e) => (e.currentTarget.style.background = GREEN_HOVER)}
        onMouseLeave={(e) => (e.currentTarget.style.background = GREEN)}
      >
        ADD
      </button>
    );
  }

  return (
    <div
      className={`flex ${btnHeight} ${btnWidth} items-center justify-between rounded-lg px-1 text-white shadow-sm transition-all duration-150 ${className}`}
      style={{ background: GREEN }}
    >
      <button
        type="button"
        onClick={onDec}
        aria-label="Decrease quantity"
        className={`grid ${isSm ? "h-7 w-7" : "h-9 w-9"} cursor-pointer place-items-center rounded-md transition hover:bg-white/15 active:scale-90`}
      >
        <Minus className="h-4 w-4 stroke-[3]" />
      </button>

      <span className="text-base font-extrabold tabular-nums select-none">{cartQty}</span>

      <button
        type="button"
        onClick={onInc}
        disabled={cartQty >= maxQty}
        aria-label="Increase quantity"
        className={`grid ${isSm ? "h-7 w-7" : "h-9 w-9"} cursor-pointer place-items-center rounded-md transition hover:bg-white/15 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <Plus className="h-4 w-4 stroke-[3]" />
      </button>
    </div>
  );
}
