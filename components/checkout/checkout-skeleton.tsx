"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function CheckoutSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pb-4 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-7 w-32 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-44 rounded-full" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 4 Step Cards */}
        <div className="lg:col-span-8 space-y-4">
          {/* Address Skeleton */}
          <div className="p-5 rounded-2xl border border-[var(--border)] bg-white space-y-3">
            <Skeleton className="h-5 w-44 rounded-md" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
          </div>

          {/* Instructions Skeleton */}
          <div className="p-5 rounded-2xl border border-[var(--border)] bg-white space-y-3">
            <Skeleton className="h-5 w-48 rounded-md" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>

          {/* Slot Skeleton */}
          <div className="p-5 rounded-2xl border border-[var(--border)] bg-white space-y-3">
            <Skeleton className="h-5 w-52 rounded-md" />
            <div className="flex gap-2.5">
              <Skeleton className="h-16 flex-1 rounded-xl" />
              <Skeleton className="h-16 flex-1 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <Skeleton className="h-10 rounded-xl" />
              <Skeleton className="h-10 rounded-xl" />
              <Skeleton className="h-10 rounded-xl" />
            </div>
          </div>

          {/* Payment Method Skeleton */}
          <div className="p-5 rounded-2xl border border-[var(--border)] bg-white space-y-3">
            <Skeleton className="h-5 w-40 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Bill */}
        <div className="lg:col-span-4 space-y-4">
          <Skeleton className="h-52 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
