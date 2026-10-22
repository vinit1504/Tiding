"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { CatalogSubcategory } from "@/types/catalog";
import { cn } from "@/lib/utils";
import { getCategoryFallbackMeta, sanitizeImageUrl } from "@/lib/utils/image-fallback";

interface SubcategorySidebarProps {
  subcategories: CatalogSubcategory[];
  selectedSubcategoryId?: string;
  onSelectSubcategory: (subcategoryId: string, slug: string) => void;
  isLoading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

function SubcategoryItemButton({
  sub,
  isSelected,
  onSelect,
}: {
  sub: CatalogSubcategory;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [hasError, setHasError] = useState(false);
  const fallback = getCategoryFallbackMeta(sub.name, sub.slug);
  const cleanImage = sanitizeImageUrl(sub.image_url);
  const shouldShowImage = cleanImage && !hasError;

  return (
    <button
      onClick={onSelect}
      title={sub.name}
      className={cn(
        "group relative flex flex-col items-center justify-center py-2 px-1 mx-1 rounded-xl transition-all duration-200 cursor-pointer text-center select-none",
        isSelected
          ? "bg-white dark:bg-neutral-800 shadow-xs text-[#18A818]"
          : "hover:bg-slate-200/60 dark:hover:bg-neutral-800/60 text-[var(--text-secondary)]"
      )}
    >
      {/* Active Green Left Indicator Bar (Kept cleanly inside button) */}
      {isSelected && (
        <span className="absolute left-0.5 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-[#18A818]" />
      )}

      {/* Subcategory Image / Fallback Container - Reduced Compact Size */}
      <div
        className={cn(
          "relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center p-1 overflow-hidden transition-transform duration-200 group-hover:scale-105",
          isSelected
            ? "bg-[#18A818]/10 border border-[#18A818]/30"
            : "bg-[var(--surface-secondary)]/80 border border-transparent"
        )}
      >
        {shouldShowImage ? (
          <div className="relative h-full w-full">
            <Image
              src={cleanImage}
              alt={sub.name}
              fill
              sizes="40px"
              className="object-contain p-0.5"
              onError={() => setHasError(true)}
            />
          </div>
        ) : (
          <span className="text-base sm:text-lg select-none filter drop-shadow-xs">
            {fallback.emoji}
          </span>
        )}
      </div>

      {/* Subcategory Name */}
      <span
        className={cn(
          "mt-1 text-[9.5px] sm:text-[10px] leading-tight line-clamp-2 max-w-[62px] sm:max-w-[70px] transition-colors",
          isSelected
            ? "font-extrabold text-[#18A818]"
            : "font-semibold text-[var(--text-primary)] group-hover:text-[var(--text-primary)]"
        )}
      >
        {sub.name}
      </span>
    </button>
  );
}

export function SubcategorySidebar({
  subcategories,
  selectedSubcategoryId,
  onSelectSubcategory,
  isLoading = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  className,
}: SubcategorySidebarProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll trigger when scrolling near bottom
  useEffect(() => {
    if (!onLoadMore || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  // Handle scroll event as fallback for IntersectionObserver
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    if (!onLoadMore || !hasNextPage || isFetchingNextPage) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + clientHeight) < 100) {
      onLoadMore();
    }
  };

  if (isLoading && (!subcategories || subcategories.length === 0)) {
    return (
      <aside
        className={cn(
          "w-[68px] sm:w-[76px] md:w-[84px] shrink-0 h-full border-r border-slate-100 dark:border-neutral-800 bg-slate-50/60 dark:bg-neutral-900/60 py-3 space-y-3",
          className
        )}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center px-1 space-y-1.5">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-[var(--surface-secondary)] animate-pulse" />
            <div className="h-2 w-10 rounded bg-[var(--surface-secondary)] animate-pulse" />
          </div>
        ))}
      </aside>
    );
  }

  if (!subcategories || subcategories.length === 0) {
    return null;
  }

  return (
    <aside
      aria-label="Subcategories"
      onScroll={handleScroll}
      className={cn(
        "w-[70px] sm:w-[78px] md:w-[86px] shrink-0 h-full border-r border-slate-200/70 dark:border-neutral-800 bg-slate-50/80 dark:bg-neutral-900/70 overflow-y-auto no-scrollbar py-2.5 select-none rounded-l-2xl",
        className
      )}
    >
      <div className="flex flex-col gap-1.5 pb-20">
        {subcategories.map((sub) => {
          const isSelected =
            selectedSubcategoryId === sub.id ||
            selectedSubcategoryId === sub.slug;

          return (
            <SubcategoryItemButton
              key={sub.id}
              sub={sub}
              isSelected={isSelected}
              onSelect={() => onSelectSubcategory(sub.id, sub.slug)}
            />
          );
        })}

        {/* Scrollable Pagination Loader / Sentinel */}
        <div ref={sentinelRef} className="py-2 flex items-center justify-center min-h-[28px]">
          {isFetchingNextPage && (
            <div className="h-4 w-4 rounded-full border-2 border-[#18A818] border-t-transparent animate-spin" />
          )}
        </div>
      </div>
    </aside>
  );
}
