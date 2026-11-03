"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function CartSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pb-4 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-7 w-40 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-48 rounded-full" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Items) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Delivery banner skeleton */}
          <Skeleton className="h-24 w-full rounded-2xl" />

          {/* Items Header */}
          <div className="flex justify-between items-center px-1">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>

          {/* 3 Cart Item Skeletons */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-20 w-20 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/3 rounded-md" />
                  <Skeleton className="h-4 w-1/4 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <Skeleton className="h-8 w-24 rounded-xl" />
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Right Column (Coupon & Bill Details) */}
        <div className="lg:col-span-4 space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
