"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Product } from "@/types/product";

const GREEN = "#318616";

export interface ProductDetailsAccordionProps {
  product: Product;
  activeVariant?: any;
  unitLabel: string;
}

export function ProductDetailsAccordion({
  product,
  activeVariant,
  unitLabel,
}: ProductDetailsAccordionProps) {
  const [showMore, setShowMore] = useState(false);

  const p = product as any;

  // Build detail rows
  const detailRows: { title: string; value: string }[] = [
    {
      title: "Description",
      value: product.description || "Fresh daily grocery sourced from verified partners.",
    },
    {
      title: "Brand",
      value: product.brand || "Tiding",
    },
    {
      title: "Category",
      value: [product.category_name, product.subcategory_name].filter(Boolean).join(" › "),
    },
    {
      title: "Pack Size",
      value: unitLabel,
    },
    ...(activeVariant?.weight_in_grams
      ? [{ title: "Net Weight", value: `${activeVariant.weight_in_grams} g` }]
      : []),
    ...(p.food_preference
      ? [
          {
            title: "Food Preference",
            value:
              p.food_preference === "VEG"
                ? "Vegetarian"
                : p.food_preference === "NON_VEG"
                ? "Non-Vegetarian"
                : p.food_preference,
          },
        ]
      : []),
    ...(activeVariant?.sku ? [{ title: "SKU", value: activeVariant.sku }] : []),
    ...(Array.isArray(p.tags) && p.tags.length > 0
      ? [
          {
            title: "Tags",
            value: p.tags
              .map((t: string) => t.charAt(0).toUpperCase() + t.slice(1))
              .join(", "),
          },
        ]
      : []),
  ];

  const visibleRows = showMore ? detailRows : detailRows.slice(0, 1);

  return (
    <div className="mt-8 border-t border-slate-100 pt-6">
      <h2 className="text-lg font-extrabold text-slate-900">Product Details</h2>
      <div className="mt-3 space-y-3">
        {visibleRows.map((row) => (
          <div key={row.title}>
            <p className="text-sm font-bold text-slate-900">{row.title}</p>
            <p
              className={`mt-0.5 text-[13px] leading-relaxed text-slate-600 whitespace-pre-line ${
                !showMore && row.title === "Description" ? "line-clamp-2" : ""
              }`}
            >
              {row.value}
            </p>
          </div>
        ))}
      </div>

      {detailRows.length > 1 && (
        <button
          type="button"
          onClick={() => setShowMore((prev) => !prev)}
          className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold cursor-pointer transition hover:opacity-85"
          style={{ color: GREEN }}
        >
          {showMore ? "View less details" : "View more details"}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              showMore ? "rotate-180" : ""
            }`}
          />
        </button>
      )}
    </div>
  );
}
