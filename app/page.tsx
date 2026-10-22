"use client";

import React from "react";
import { useAtomValue } from "jotai";
import { PromoCarousel } from "@/components/home/promo-carousel";
import { TidingCategoryGrid } from "@/components/home/tiding-category-grid";
import { CategoryShelf } from "@/components/home/category-shelf";
import { ProductCard } from "@/components/product/product-card";
import { selectedCategorySlugAtom } from "@/stores";
import { useProductsQuery, useCategoriesQuery } from "@/queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, ShieldCheck, Clock } from "lucide-react";

export default function HomePage() {
  const selectedCategorySlug = useAtomValue(selectedCategorySlugAtom);
  const { data: categories, isLoading: isCategoriesLoading } = useCategoriesQuery();
  const { data: allProducts, isLoading: isProductsLoading } = useProductsQuery();

  // If a specific category tab is selected (not "all")
  const isFilteredCategory = selectedCategorySlug && selectedCategorySlug !== "all";
  const activeCategory = categories?.find((c) => c.slug === selectedCategorySlug);
  const filteredProducts = allProducts?.filter(
    (p) => p.category_slug === selectedCategorySlug
  ) || [];

  // Group real API products by category to dynamically render shelves
  const categoryShelves = React.useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];

    const map = new Map<string, { categoryName: string; categorySlug: string; products: typeof allProducts }>();

    for (const prod of allProducts) {
      const catKey = prod.category_id || prod.category_slug || "fresh";
      const matchingCat = categories?.find((c) => c.id === prod.category_id || c.slug === prod.category_slug);
      const catName = matchingCat?.name || prod.category_name || "Daily Essentials";
      const catSlug = matchingCat?.slug || prod.category_slug || prod.category_id;

      if (!map.has(catKey)) {
        map.set(catKey, {
          categoryName: catName,
          categorySlug: catSlug,
          products: [],
        });
      }
      map.get(catKey)!.products.push(prod);
    }

    return Array.from(map.values());
  }, [allProducts, categories]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Small Promotional Banner Carousel Section */}
      <PromoCarousel />

      {/* 2. Tiding 20-Category Grid Section */}
      <TidingCategoryGrid />

      {/* 3. Shelves Container */}
      <div id="shelves-section" className="flex-1 w-full pb-16">
        {isProductsLoading ? (
          /* Skeletons while loading */
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-6 w-48" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
        ) : isFilteredCategory ? (
          /* Single Selected Category View */
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
            <div className="flex items-center justify-between pb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{activeCategory?.icon || "🛒"}</span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                    {activeCategory?.name || "Selected Category"}
                  </h1>
                  <p className="text-xs text-[var(--text-muted)]">
                    Showing {filteredProducts.length} fresh products
                  </p>
                </div>
              </div>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center space-y-2">
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  No products found in this category right now.
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Please explore other fresh categories above.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* "All" Overview: Dynamically rendered real shelves from backend API */
          <>
            {categoryShelves.map((shelf) => (
              <CategoryShelf
                key={shelf.categorySlug}
                title={shelf.categoryName}
                categorySlug={shelf.categorySlug}
                subtitle="Fresh essentials with express doorstep delivery"
                products={shelf.products}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
