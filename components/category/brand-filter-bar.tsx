"use client";

import React from "react";
import { CatalogBrand } from "@/types/catalog";
import { cn } from "@/lib/utils";
import { ArrowUpDown, Store } from "lucide-react";

interface BrandFilterBarProps {
  brands: CatalogBrand[];
  selectedBrandId: string;
  onSelectBrand: (brandId: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  storeName?: string;
  deliveryEtaMinutes?: number;
}

export function BrandFilterBar({
  brands,
  selectedBrandId,
  onSelectBrand,
  sortBy,
  onSortChange,
  storeName,
  deliveryEtaMinutes = 9,
}: BrandFilterBarProps) {
  return (
    <div className="w-full border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 select-none sticky top-[65px] z-10 backdrop-blur-md">
      {/* Brand Horizontal Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => onSelectBrand("all")}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0",
            selectedBrandId === "all" || !selectedBrandId
              ? "bg-[#18A818] text-white border-[#18A818] shadow-xs"
              : "bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          )}
        >
          All Brands
        </button>

        {brands.map((brand) => {
          const isSelected = selectedBrandId === brand.id || selectedBrandId === brand.slug;
          return (
            <button
              key={brand.id}
              onClick={() => onSelectBrand(brand.slug || brand.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border shrink-0",
                isSelected
                  ? "bg-[#18A818] text-white border-[#18A818] shadow-xs font-bold"
                  : "bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
              )}
            >
              {brand.name}
            </button>
          );
        })}
      </div>

      {/* Right Controls: Store status & Sorting */}
      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto text-xs">
        {storeName && (
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] bg-[var(--surface-secondary)] px-2.5 py-1 rounded-full border border-[var(--border)]">
            <Store className="h-3.5 w-3.5 text-[#18A818]" />
            <span
              suppressHydrationWarning
              className="font-semibold text-[var(--text-secondary)] truncate max-w-[140px]"
            >
              {storeName}
            </span>
            <span suppressHydrationWarning className="font-bold text-[#18A818]">
              ⚡ {deliveryEtaMinutes}m
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-[var(--surface-secondary)] text-[var(--text-primary)] text-xs font-semibold rounded-lg px-2 py-1 border border-[var(--border)] outline-none focus:ring-1 focus:ring-[#18A818] cursor-pointer"
          >
            <option value="relevance">Relevance</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="discount">Highest Discount</option>
          </select>
        </div>
      </div>
    </div>
  );
}
