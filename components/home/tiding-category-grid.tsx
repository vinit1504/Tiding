"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Zap } from "lucide-react";
import { TIDING_HOME_CATEGORIES } from "@/lib/constants/categories";
import { useCategoriesQuery } from "@/queries/catalog";
import { getCategoryFallbackMeta, sanitizeImageUrl } from "@/lib/utils/image-fallback";

interface CategoryGridItem {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  bgColor?: string;
  emoji?: string;
}

function CategoryTile({ item, priority = false }: { item: CategoryGridItem; priority?: boolean }) {
  const [hasError, setHasError] = useState(false);
  const fallback = getCategoryFallbackMeta(item.name, item.slug);
  const bgColor = item.bgColor || fallback.bgColor || "#F4F6F8";

  const cleanImage = sanitizeImageUrl(item.image);
  const shouldShowImage = cleanImage && !hasError;

  return (
    <Link
      href={`/category/${item.slug}`}
      title={`Shop ${item.name}`}
      className="group flex flex-col items-center text-center focus-visible:outline-none cursor-pointer active:scale-95 transition-transform duration-150"
    >
      <div
        style={{ backgroundColor: bgColor }}
        className="relative aspect-square w-full rounded-2xl p-2 sm:p-3 flex items-center justify-center overflow-hidden shadow-sm ring-1 ring-black/5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-[#18A818]"
      >
        {shouldShowImage ? (
          <Image
            src={cleanImage}
            alt={item.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 25vw, (max-width: 1024px) 12vw, 10vw"
            className="object-contain p-2 sm:p-3 drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center select-none">
            <span className="text-3xl sm:text-4xl transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6">
              {item.emoji || fallback.emoji}
            </span>
          </div>
        )}
      </div>

      <span className="mt-2 text-[11px] sm:text-[13px] font-semibold text-[var(--text-primary)] group-hover:text-[#18A818] transition-colors leading-tight line-clamp-2 max-w-[90px] sm:max-w-[110px]">
        {item.name}
      </span>
    </Link>
  );
}

function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center animate-pulse">
      <div className="aspect-square w-full rounded-2xl bg-slate-200/70" />
      <div className="mt-2 h-3 w-12 rounded bg-slate-200/70" />
    </div>
  );
}

export function TidingCategoryGrid() {
  const { data: apiCategories, isLoading } = useCategoriesQuery();

  const categoriesList = React.useMemo<CategoryGridItem[]>(() => {
    if (apiCategories && apiCategories.length > 0) {
      return apiCategories
        .filter((cat) => cat.id !== "cat-all" && cat.slug !== "all")
        .map((cat) => {
          const matchingHome = TIDING_HOME_CATEGORIES.find(
            (h) => h.slug === cat.slug || h.name.toLowerCase() === cat.name.toLowerCase()
          );
          const fallback = getCategoryFallbackMeta(cat.name, cat.slug);
          const rawImage = cat.image_url || cat.icon_url || matchingHome?.image || null;

          return {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            image: sanitizeImageUrl(rawImage, matchingHome?.image),
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
        {/* Header */}
        <div className="flex items-end justify-between mb-4 sm:mb-5">
          <div>
            <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Shop by Category
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm text-[var(--text-muted)] font-medium">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#18A818]/10 px-2 py-0.5 text-[11px] font-bold text-[#18A818]">
                <Zap className="h-3 w-3 fill-current" /> Express
              </span>
              Fresh essentials & groceries delivered fast
            </p>
          </div>

          <Link
            href="/categories"
            className="inline-flex items-center text-xs sm:text-sm font-bold text-[#18A818] hover:underline"
          >
            See all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-x-2.5 gap-y-4 sm:gap-x-4 sm:gap-y-6">
          {isLoading && !apiCategories
            ? Array.from({ length: 10 }).map((_, i) => <CategorySkeleton key={i} />)
            : categoriesList.map((item, i) => (
              <CategoryTile key={item.id} item={item} priority={i < 8} />
            ))}
        </div>
      </div>
    </section>
  );
}