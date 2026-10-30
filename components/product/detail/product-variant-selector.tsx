"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";
import { OfferRibbon } from "./offer-ribbon";

const GREEN = "#318616";
const GREEN_DARK = "#1b5a0a";
const GREEN_LIGHT = "#f1fbea";
const GREEN_BORDER = "#cfe9c2";

export interface ProductVariantSelectorProps {
  variants: any[];
  activeVariantId?: string;
  onSelectVariant: (variantId: string) => void;
  getVariantQty: (variantId: string) => number;
}

export function ProductVariantSelector({
  variants,
  activeVariantId,
  onSelectVariant,
  getVariantQty,
}: ProductVariantSelectorProps) {
  if (!variants || variants.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-bold text-slate-900">Select Unit</h3>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-6 pt-3">
        {variants.map((v) => {
          const isSelected = v.id === activeVariantId;
          const vPrice = Number(v.selling_price ?? v.price ?? 0);
          const vMrp = Number(v.mrp ?? vPrice);
          const vDiscount = vMrp > vPrice ? Math.round(((vMrp - vPrice) / vMrp) * 100) : 0;
          const vSave = Math.max(vMrp - vPrice, 0);
          const vQty = getVariantQty(v.id);
          const isAvailable = v.isAvailable !== false && v.is_in_stock !== false;

          return (
            <button
              key={v.id}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelectVariant(v.id)}
              className={`group relative min-w-[104px] rounded-xl border-2 px-3 pb-2.5 pt-5 text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "border-[#318616] shadow-[0_6px_16px_rgba(49,134,22,0.22)] -translate-y-0.5"
                  : "border-slate-200 bg-white hover:border-[#318616]/50 hover:shadow-md"
              } ${!isAvailable ? "cursor-not-allowed opacity-50 grayscale" : ""}`}
              style={
                isSelected
                  ? { background: `linear-gradient(180deg, ${GREEN_LIGHT}, #ffffff)` }
                  : undefined
              }
            >
              {/* Discount Ribbon on top */}
              {vDiscount > 0 && <OfferRibbon text={`${vDiscount}% OFF`} selected={isSelected} />}

              {/* In-cart count badge */}
              {vQty > 0 && (
                <span
                  className="absolute -right-2.5 -top-4 z-20 grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs font-black text-white ring-2 ring-white shadow-sm"
                  style={{ background: `linear-gradient(135deg,#43b922,${GREEN_DARK})` }}
                >
                  {vQty}
                </span>
              )}

              {/* Selected tick badge */}
              {isSelected && (
                <span
                  className="absolute bottom-2 right-2 grid h-4 w-4 place-items-center rounded-full text-white shadow-xs"
                  style={{ background: GREEN }}
                >
                  <svg
                    viewBox="0 0 12 12"
                    className="h-2.5 w-2.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2.5 6.5l2.2 2.2L9.5 3.8" />
                  </svg>
                </span>
              )}

              {/* Unit title */}
              <p className={`text-[13px] font-extrabold ${isSelected ? "text-[#1b5a0a]" : "text-slate-800"}`}>
                {v.unit}
              </p>

              {/* Price Row */}
              <p className="mt-1 flex items-baseline gap-1.5">
                <span className="text-sm font-black text-slate-900">{formatCurrency(vPrice)}</span>
                {vMrp > vPrice && (
                  <span className="text-[11px] font-medium text-slate-400 line-through">
                    {formatCurrency(vMrp)}
                  </span>
                )}
              </p>

              {/* Save amount pill */}
              {vSave > 0 && isAvailable && (
                <p
                  className="mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                  style={{
                    background: GREEN_LIGHT,
                    color: GREEN,
                    border: `1px solid ${GREEN_BORDER}`,
                  }}
                >
                  Save {formatCurrency(vSave)}
                </p>
              )}

              {/* Out of stock alert */}
              {!isAvailable && (
                <p className="mt-1 text-[10px] font-bold text-rose-500">Out of stock</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
