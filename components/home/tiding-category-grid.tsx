"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TIDING_HOME_CATEGORIES } from "@/lib/constants/categories";
import { useCategoriesQuery } from "@/queries/catalog";
import { getCategoryFallbackMeta } from "@/lib/utils/image-fallback";

interface CategoryGridItem {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  bgColor?: string;
  emoji?: string;
}

function CategoryTile({ item }: { item: CategoryGridItem }) {
  const [hasError, setHasError] = useState(false);
  const fallback = getCategoryFallbackMeta(item.name, item.slug);
  const bgColor = item.bgColor || fallback.bgColor || "#F4F6F8";

  const cleanImage = item.image && item.image.trim() !== "" ? item.image : null;
  const shouldShowImage = cleanImage && !hasError;

  return (
    <Link
      href={`/category/${item.slug}?categoryId=${item.id}`}
      className="group flex flex-col items-center text-center focus:outline-none cursor-pointer"
      title={`Shop ${item.name}`}
    >
      {/* Soft Rounded Card Container */}
      <div
        style={{ backgroundColor: bgColor }}
        className="relative aspect-square w-full rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 flex items-center justify-center overflow-hidden border border-[var(--border)]/60 transition-all duration-200 group-hover:scale-105 group-hover:shadow-md group-hover:border-[#18A818]/50"
      >
        {shouldShowImage ? (
          <div className="relative h-full w-full">
            <Image
              src={cleanImage}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 25vw, (max-width: 1024px) 12vw, 10vw"
              className="object-cover rounded-xl transition-transform duration-300 group-hover:scale-110"
              onError={() => setHasError(true)}
            />
          </div>
        ) : (
          /* Graceful Fallback UI when image cannot be retrieved or fails */
          <div className="relative h-full w-full flex flex-col items-center justify-center rounded-xl bg-white/40 backdrop-blur-xs select-none">
            <span className="text-3xl sm:text-4xl transform transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6 filter drop-shadow-xs">
              {item.emoji || fallback.emoji}
            </span>
            <span className="mt-1 text-[9px] font-black uppercase tracking-wider text-slate-500/90 line-clamp-1 max-w-[90%]">
              {fallback.label}
            </span>
          </div>
        )}
      </div>

      {/* Category Title */}
      <span className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs font-bold text-[var(--text-primary)] group-hover:text-[#18A818] transition-colors leading-tight line-clamp-2 text-center max-w-[85px] sm:max-w-[100px]">
        {item.name}
      </span>
    </Link>
  );
}

export function TidingCategoryGrid() {
  const { data: apiCategories } = useCategoriesQuery();

  // Map all real API categories directly to grid items
  const categoriesList = React.useMemo<CategoryGridItem[]>(() => {
    if (apiCategories && apiCategories.length > 0) {
      return apiCategories
        .filter((cat) => cat.id !== "cat-all" && cat.slug !== "all")
        .map((cat) => {
          const matchingHome = TIDING_HOME_CATEGORIES.find(
            (h) => h.slug === cat.slug || h.name.toLowerCase() === cat.name.toLowerCase()
          );
          const fallback = getCategoryFallbackMeta(cat.name, cat.slug);

          return {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            image: cat.image_url || cat.icon_url || matchingHome?.image || null,
            bgColor: matchingHome?.bgColor || fallback.bgColor,
            emoji: matchingHome?.icon || fallback.emoji,
          };
        });
    }
    return TIDING_HOME_CATEGORIES;
  }, [apiCategories]);

  return (
    <section aria-label="Explore Tiding Categories" className="w-full py-4 sm:py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-base sm:text-xl font-black tracking-tight text-[var(--text-primary)]">
              Shop by Category
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-medium">
              Explore all {categoriesList.length} fresh essentials & grocery categories delivered in 10 minutes
            </p>
          </div>
          <span className="hidden sm:inline-block text-xs font-bold text-[#18A818]">
            ⚡ 10-Min Fast Delivery
          </span>
        </div>

        {/* 20-Category Responsive Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2.5 sm:gap-4 md:gap-5">
          {categoriesList.map((item) => (
            <CategoryTile key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
