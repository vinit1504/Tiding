"use client";

import React from "react";
import Link from "next/link";
import { useAtomValue, useSetAtom } from "jotai";
import { ArrowLeft, ChevronRight, Clock, ShieldCheck, Zap } from "lucide-react";
import { PromoCarousel } from "@/components/home/promo-carousel";
import { TidingCategoryGrid } from "@/components/home/tiding-category-grid";
import { CategoryShelf } from "@/components/home/category-shelf";
import { ProductCard } from "@/components/product/product-card";
import { selectedCategorySlugAtom } from "@/stores";
import { useProductsQuery, useCategoriesQuery } from "@/queries";
import { Skeleton } from "@/components/ui/skeleton";

const TRUST_ITEMS = [
  { icon: Zap, title: "Express delivery", text: "At your door fast" },
  { icon: ShieldCheck, title: "Quality assured", text: "Fresh, checked daily" },
  { icon: Clock, title: "Always on time", text: "Track every order" },
];

function TrustStrip() {
  return (
    <div className="mx-auto w-full max-w-7xl px-3 sm:px-6">
      <div className="grid grid-cols-3 divide-x divide-black/5 rounded-2xl bg-white py-3 ring-1 ring-black/5 shadow-sm sm:py-4">
        {TRUST_ITEMS.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="flex min-w-0 flex-col items-center gap-1 px-2 text-center sm:flex-row sm:justify-center sm:gap-3 sm:text-left"
          >
            <Icon className="h-5 w-5 shrink-0 text-[#18A818] sm:h-6 sm:w-6" strokeWidth={2.25} />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold leading-tight text-[var(--text-primary)] sm:text-sm">
                {title}
              </p>
              <p className="hidden truncate text-xs text-[var(--text-muted)] sm:block">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShelfSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const selectedCategorySlug = useAtomValue(selectedCategorySlugAtom);
  const setSelectedCategorySlug = useSetAtom(selectedCategorySlugAtom);
  const { data: categories } = useCategoriesQuery();
  const { data: allProducts, isLoading: isProductsLoading } = useProductsQuery();

  // If a specific category tab is selected (not "all")
  const isFilteredCategory = selectedCategorySlug && selectedCategorySlug !== "all";
  const activeCategory = categories?.find((c) => c.slug === selectedCategorySlug);
  const filteredProducts =
    allProducts?.filter((p) => p.category_slug === selectedCategorySlug) || [];

  // Group real API products by category to dynamically render shelves
  const categoryShelves = React.useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];

    const map = new Map<
      string,
      { categoryName: string; categorySlug: string; products: typeof allProducts }
    >();

    for (const prod of allProducts) {
      const catKey = prod.category_id || prod.category_slug || "fresh";
      const matchingCat = categories?.find(
        (c) => c.id === prod.category_id || c.slug === prod.category_slug
      );
      const catName = matchingCat?.name || prod.category_name || "Daily Essentials";
      const catSlug = matchingCat?.slug || prod.category_slug || prod.category_id;

      if (!map.has(catKey)) {
        map.set(catKey, { categoryName: catName, categorySlug: catSlug, products: [] });
      }
      map.get(catKey)!.products.push(prod);
    }

    return Array.from(map.values());
  }, [allProducts, categories]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-page,#F7F9F7)]">
      {/* 1. Promo banner */}
      <PromoCarousel />

      {/* 2. Category grid */}
      <TidingCategoryGrid />

      {/* 3. Trust strip */}
      <TrustStrip />

      {/* 4. Shelves */}
      <div id="shelves-section" className="w-full flex-1 pb-16 pt-2 sm:pt-4">
        {isProductsLoading ? (
          <div className="mx-auto max-w-7xl space-y-8 px-3 py-6 sm:px-6">
            <ShelfSkeleton />
            <ShelfSkeleton />
          </div>
        ) : isFilteredCategory ? (
          /* Single selected category view */
          <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
            {/* Plain back link (no background) */}
            <button
              type="button"
              onClick={() => setSelectedCategorySlug("all")}
              className="group mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:text-[#18A818]"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              All categories
            </button>

            <div className="mb-5 flex items-center gap-3 border-b border-black/5 pb-4">
              <span className="text-3xl leading-none">{activeCategory?.icon || "🛒"}</span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-black tracking-tight text-[var(--text-primary)] sm:text-2xl">
                  {activeCategory?.name || "Selected Category"}
                </h1>
                <p className="text-xs font-medium text-[var(--text-muted)] sm:text-sm">
                  {filteredProducts.length} fresh {filteredProducts.length === 1 ? "product" : "products"}
                </p>
              </div>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-6 lg:grid-cols-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3 py-20 text-center">
                <span className="text-4xl">🧺</span>
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  No products found in this category right now.
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Please explore other fresh categories above.
                </p>
                <Link
                  href="/categories"
                  className="group inline-flex items-center gap-1 text-sm font-bold text-[#18A818] hover:underline"
                >
                  Browse all categories
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* "All" overview: real shelves from the backend API */
          <div className="space-y-2 sm:space-y-4">
            {categoryShelves.map((shelf) => (
              <CategoryShelf
                key={shelf.categorySlug}
                title={shelf.categoryName}
                categorySlug={shelf.categorySlug}
                subtitle="Fresh essentials with express doorstep delivery"
                products={shelf.products}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}