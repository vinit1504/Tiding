"use client";

import React from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/types/product";

const GREEN = "#318616";

export interface ProductRelatedShelfProps {
  products: Product[];
  categorySlug?: string;
}

export function ProductRelatedShelf({
  products,
  categorySlug = "groceries",
}: ProductRelatedShelfProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="mt-8 border-t border-slate-100 px-4 pt-8 sm:px-8 lg:px-10">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-900">You Might Also Like</h2>
        <Link
          href={`/category/${categorySlug}`}
          className="text-sm font-bold hover:underline"
          style={{ color: GREEN }}
        >
          See all
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {products.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </section>
  );
}
