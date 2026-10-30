"use client";

import React from "react";

const GREEN = "#318616";
const GREEN_DARK = "#1b5a0a";

/**
 * Hanging discount ribbon for the top-left corner of the main product image
 */
export function HangingOfferRibbon({ discount }: { discount: number }) {
  if (discount <= 0) return null;

  return (
    <div
      className="pointer-events-none absolute left-3 top-0 z-10"
      style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.22))" }}
    >
      <div
        className="flex min-w-[44px] flex-col items-center px-2.5 pb-4 pt-2.5 leading-none text-white"
        style={{
          background: "linear-gradient(180deg,#43b922,#2a7a10)",
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 84%, 0 100%)",
        }}
      >
        <span className="text-sm font-black tracking-tight">{discount}%</span>
        <span className="mt-0.5 text-[9px] font-extrabold tracking-[0.14em]">OFF</span>
      </div>
    </div>
  );
}

/**
 * Folded ribbon with swallow-tail ends, sitting on the top edge of a variant card
 */
export function OfferRibbon({ text, selected }: { text: string; selected?: boolean }) {
  return (
    <div className="pointer-events-none absolute -left-1.5 -right-1.5 -top-3 z-10 h-[22px] drop-shadow-[0_2px_2px_rgba(0,0,0,0.18)]">
      {/* ribbon body */}
      <div
        className="flex h-full items-center justify-center text-[10px] font-black uppercase tracking-wider text-white"
        style={{
          background: selected
            ? "linear-gradient(90deg,#2a7a10,#3fb11f 50%,#2a7a10)"
            : "linear-gradient(90deg,#318616,#43b922 50%,#318616)",
          clipPath: "polygon(0 0, 100% 0, calc(100% - 6px) 50%, 100% 100%, 0 100%, 6px 50%)",
        }}
      >
        {text}
      </div>
      {/* folded corners */}
      <span
        className="absolute left-0 top-full h-1.5 w-1.5"
        style={{ background: GREEN_DARK, clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
      />
      <span
        className="absolute right-0 top-full h-1.5 w-1.5"
        style={{ background: GREEN_DARK, clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
      />
    </div>
  );
}
