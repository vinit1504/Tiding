"use client";

import React, { useState, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "@/components/product/product-card";
import { useProductsQuery } from "@/queries/catalog/use-products-query";
import { useCart } from "@/hooks/use-cart";
import { Product } from "@/types/product";

export function CartRecommendations() {
  const [activeTab, setActiveTab] = useState<"frequently" | "youMayLike" | "recent">("frequently");
  const { items } = useCart();
  const { data: products, isLoading } = useProductsQuery({ limit: 20 });

  const cartProductIds = useMemo(
    () => new Set(items.map((i) => i.productId || i.id)),
    [items]
  );

  const displayProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    const candidates = products.filter((p) => !cartProductIds.has(p.id));

    if (activeTab === "frequently") {
      // Prioritize bestsellers or top ordered items
      return [...candidates]
        .sort((a, b) => {
          const aBs = (a as Product & { is_bestseller?: boolean }).is_bestseller ? 1 : 0;
          const bBs = (b as Product & { is_bestseller?: boolean }).is_bestseller ? 1 : 0;
          return bBs - aBs;
        })
        .slice(0, 6);
    } else if (activeTab === "recent") {
      // Prioritize new or trending items
      return [...candidates]
        .sort((a, b) => {
          const aNew = (a as Product & { is_new?: boolean }).is_new ? 1 : 0;
          const bNew = (b as Product & { is_new?: boolean }).is_new ? 1 : 0;
          return bNew - aNew;
        })
        .slice(0, 6);
    } else {
      // You may like: high rating or balanced mix
      return [...candidates]
        .sort((a, b) => {
          const aRate = Number((a as Product & { rating?: number; average_rating?: number }).rating ?? (a as Product & { rating?: number; average_rating?: number }).average_rating ?? 0);
          const bRate = Number((b as Product & { rating?: number; average_rating?: number }).rating ?? (b as Product & { rating?: number; average_rating?: number }).average_rating ?? 0);
          return bRate - aRate;
        })
        .slice(0, 6);
    }
  }, [products, cartProductIds, activeTab]);

  if (!isLoading && displayProducts.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs space-y-4">
      {/* Header and Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary-light)] text-[var(--primary)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)]">
            Recommended Add-ons
          </h3>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-[var(--surface-secondary)] p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("frequently")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
              activeTab === "frequently"
                ? "bg-[var(--surface)] text-[var(--brand-green-dark)] shadow-xs font-bold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Bought Together
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("youMayLike")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
              activeTab === "youMayLike"
                ? "bg-[var(--surface)] text-[var(--brand-green-dark)] shadow-xs font-bold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            You May Like
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("recent")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
              activeTab === "recent"
                ? "bg-[var(--surface)] text-[var(--brand-green-dark)] shadow-xs font-bold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Trending
          </button>
        </div>
      </div>

      {/* Grid of Product Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {displayProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
