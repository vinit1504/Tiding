"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
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

/* Keyframes live here so no tailwind.config change is needed.
   You can move this block to globals.css if you prefer. */
const CATEGORY_GRID_STYLES = `
@keyframes tidingFadeUp {
  from { opacity: 0; transform: translateY(10px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes tidingShimmer {
  100% { transform: translateX(100%); }
}
.tiding-tile-in { animation: tidingFadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
.tiding-shimmer::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent);
  animation: tidingShimmer 1.4s infinite;
}
@media (prefers-reduced-motion: reduce) {
  .tiding-tile-in { animation: none; }
  .tiding-shimmer::after { animation: none; }
}
`;

function CategoryTile({
  item,
  index,
  priority = false,
}: {
  item: CategoryGridItem;
  index: number;
  priority?: boolean;
}) {
  const [hasError, setHasError] = useState(false);
  const fallback = getCategoryFallbackMeta(item.name, item.slug);
  const bgColor = item.bgColor || fallback.bgColor || "#F4F6F8";

  const cleanImage = sanitizeImageUrl(item.image);
  const shouldShowImage = cleanImage && !hasError;

  return (
    <Link
      href={`/category/${item.slug}`}
      prefetch={index < 4}
      title={`Shop ${item.name}`}
      style={{ animationDelay: `${Math.min(index, 20) * 35}ms` }}
      className="tiding-tile-in group flex min-w-0 flex-col items-center text-center rounded-2xl outline-none cursor-pointer active:scale-95 transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-[#18A818] focus-visible:ring-offset-2"
    >
      {/* Image card */}
      <div
        style={{ backgroundColor: bgColor }}
        className="relative aspect-square w-full overflow-hidden rounded-2xl p-2 sm:p-3 flex items-center justify-center
                   ring-1 ring-black/5 shadow-[0_1px_2px_rgba(16,24,40,0.06)]
                   transition-all duration-300 ease-out
                   group-hover:-translate-y-1 group-hover:shadow-[0_12px_24px_-8px_rgba(24,168,24,0.35)] group-hover:ring-[#18A818]/30"
      >
        {/* Sheen + decorative blob */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/60 via-white/10 to-transparent" />
        <div className="pointer-events-none absolute -right-4 -top-4 h-14 w-14 rounded-full bg-white/40 blur-[2px] transition-transform duration-500 group-hover:scale-150" />

        {shouldShowImage ? (
          <Image
            src={cleanImage}
            alt={item.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 25vw, (max-width: 1024px) 12vw, 10vw"
            className="relative object-contain p-2.5 sm:p-3.5 drop-shadow-md transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-2"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center select-none">
            <span className="text-3xl sm:text-4xl drop-shadow-sm transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6">
              {item.emoji || fallback.emoji}
            </span>
          </div>
        )}
      </div>

      {/* Label */}
      <span className="mt-2 w-full px-0.5 text-[11px] sm:text-[13px] font-semibold leading-tight text-[var(--text-primary)] line-clamp-2 break-words transition-colors group-hover:text-[#18A818]">
        {item.name}
      </span>
    </Link>
  );
}

function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center">
      <div className="tiding-shimmer relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-200/70" />
      <div className="tiding-shimmer relative mt-2 h-3 w-3/4 overflow-hidden rounded-full bg-slate-200/70" />
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
    <section aria-label="Explore Tiding Categories" className="w-full py-3 sm:py-6">
      <style>{CATEGORY_GRID_STYLES}</style>

      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#18A818]/[0.07] via-white to-white p-4 ring-1 ring-black/5 shadow-sm sm:p-6">
          {/* Soft background glow */}
          <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#18A818]/10 blur-3xl" />

          {/* Header */}
          <div className="relative mb-4 flex items-center justify-between gap-3 sm:mb-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="hidden h-10 w-1.5 rounded-full bg-gradient-to-b from-[#18A818] to-[#7ED957] sm:block" />
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold tracking-tight text-[var(--text-primary)] sm:text-2xl">
                  Shop by Category
                </h2>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[var(--text-muted)] sm:text-sm">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#18A818] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm shadow-[#18A818]/30 sm:text-[11px]">
                    <Zap className="h-3 w-3 fill-current" /> Express
                  </span>
                  <span className="truncate">Fresh essentials &amp; groceries delivered fast</span>
                </p>
              </div>
            </div>

            <Link
              href="/categories"
              className="group/see inline-flex shrink-0 items-center gap-1 rounded-full bg-[#18A818]/10 px-3 py-1.5 text-xs font-bold text-[#18A818] transition-colors hover:bg-[#18A818] hover:text-white sm:text-sm"
            >
              See all
              <ArrowRight className="h-4 w-4 transition-transform group-hover/see:translate-x-0.5" />
            </Link>
          </div>

          {/* Grid: wraps to fit, never scrolls */}
          <div className="relative grid grid-cols-4 gap-x-2.5 gap-y-4 sm:grid-cols-5 sm:gap-x-4 sm:gap-y-6 md:grid-cols-8 lg:grid-cols-10">
            {isLoading && !apiCategories
              ? Array.from({ length: 10 }).map((_, i) => <CategorySkeleton key={i} />)
              : categoriesList.map((item, i) => (
                <CategoryTile key={item.id} item={item} index={i} priority={i < 8} />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}