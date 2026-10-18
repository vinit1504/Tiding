"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useProductsQuery } from "@/queries";
import { ProductCard } from "@/components/product/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const { data: products, isLoading } = useProductsQuery({ search: query });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
      {/* Search Header */}
      <div className="border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
          <Search className="h-3.5 w-3.5" />
          <span>Search Results</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
          {query ? `Results for "${query}"` : "Search Groceries & Essentials"}
        </h1>
        {query && (
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Found {products?.length || 0} matching items
          </p>
        )}
      </div>

      {/* Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--text-muted)]">
            <Search className="h-7 w-7" />
          </div>
          <h2 className="text-sm font-bold text-[var(--text-primary)]">
            No matching items found for &quot;{query}&quot;
          </h2>
          <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
            Try checking for spelling errors or searching for general terms like &quot;milk&quot;, &quot;vegetables&quot;, or &quot;fruits&quot;.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
