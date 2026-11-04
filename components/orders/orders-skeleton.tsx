"use client";

import React from "react";

export function OrdersSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-4 animate-pulse shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200" />
              <div className="space-y-1.5">
                <div className="h-4 w-36 bg-gray-200 rounded" />
                <div className="h-3 w-28 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="h-4 w-4 bg-gray-200 rounded" />
          </div>
          <div className="flex gap-2.5">
            <div className="h-14 w-14 sm:h-16 sm:w-16 bg-gray-100 rounded-xl" />
            <div className="h-14 w-14 sm:h-16 sm:w-16 bg-gray-100 rounded-xl" />
            <div className="h-14 w-14 sm:h-16 sm:w-16 bg-gray-100 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
