import React from "react";
import { SubcategorySidebarSkeleton } from "./subcategory-sidebar";
import { ProductCardSkeleton } from "@/components/product/product-card";

export function CategoryPlpSkeleton() {
  return (
    <div
      style={{ height: "calc(100dvh - 75px)" }}
      className="flex w-full flex-col overflow-hidden bg-gradient-to-b from-[#EEF3F0] to-[#F4F6F8] p-2 dark:from-neutral-950 dark:to-neutral-950 sm:p-3 md:p-3.5"
    >
      <div className="mx-auto flex h-full w-full max-w-7xl flex-row overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)] dark:border-neutral-800 dark:bg-neutral-900">
        {/* Left Subcategory Rail / Drawer Skeleton */}
        <SubcategorySidebarSkeleton className="h-full" />

        {/* Right Product Panel Skeleton */}
        <div className="relative h-full min-w-0 flex-1 overflow-y-auto no-scrollbar bg-[#F6F8F6] px-2.5 pb-24 dark:bg-neutral-900 sm:px-4 md:px-5">
          {/* Sticky Header Skeleton */}
          <div className="sticky top-0 z-30 -mx-2.5 mb-3 border-b border-slate-100 bg-white/95 px-2.5 pb-3.5 pt-3.5 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95 sm:-mx-4 sm:mb-4 sm:px-4 sm:pt-5 md:-mx-5 md:px-5">
            {/* Breadcrumb Skeleton */}
            <div className="mb-2 flex items-center gap-1.5">
              <div className="h-2.5 w-10 rounded-full bg-slate-200/70 dark:bg-neutral-800 animate-pulse" />
              <div className="h-2 w-2 rounded-full bg-slate-200/50 dark:bg-neutral-800" />
              <div className="h-2.5 w-24 rounded-full bg-slate-200/70 dark:bg-neutral-800 animate-pulse" />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-6 sm:h-7 w-36 sm:w-48 rounded-lg bg-slate-200/80 dark:bg-neutral-800 animate-pulse" />
                  <div className="h-5 w-14 rounded-full bg-slate-200/60 dark:bg-neutral-800 animate-pulse" />
                </div>
                <div className="h-3 w-32 rounded-full bg-slate-200/60 dark:bg-neutral-800 animate-pulse" />
              </div>

              {/* ETA Pill Skeleton */}
              <div className="h-7 w-20 rounded-full bg-slate-200/80 dark:bg-neutral-800 animate-pulse" />
            </div>
          </div>

          {/* Product Grid Skeleton (matches exact PLP grid: 2 cols on mobile, up to 7 on lg desktop) */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 md:gap-2 lg:grid-cols-7 gap-y-3 sm:gap-y-3.5 [&>*]:min-w-0">
            {Array.from({ length: 14 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
