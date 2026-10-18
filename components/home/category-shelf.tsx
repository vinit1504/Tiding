"use client";

import React from "react";
import { ProductShelf } from "@/components/product/product-shelf";
import { Product } from "@/types/product";

interface CategoryShelfProps {
  title: string;
  categorySlug: string;
  icon?: string;
  subtitle?: string;
  products: Product[];
}

export function CategoryShelf({
  title,
  categorySlug,
  subtitle,
  products,
}: CategoryShelfProps) {
  return (
    <ProductShelf
      title={title}
      categorySlug={categorySlug}
      subtitle={subtitle}
      products={products}
    />
  );
}
