import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { catalogService } from "@/lib/api/catalog-service";
import { CategoryPlpView } from "@/components/category/category-plp-view";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { SITE_CONFIG } from "@/lib/constants/site-config";
import { CatalogCategory } from "@/types/catalog";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await catalogService.getCategoryById(slug);
  const categoryName = category ? category.name : slug.replace(/-/g, " ");

  return {
    title: `${categoryName} - Instant Delivery in 10 Mins | ${SITE_CONFIG.name}`,
    description: `Shop fresh ${categoryName.toLowerCase()} online at ${SITE_CONFIG.name}. Delivered to your door in 10 minutes.`,
    openGraph: {
      title: `${categoryName} | ${SITE_CONFIG.name}`,
      description: `Order fresh ${categoryName.toLowerCase()} in 10 minutes.`,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Resolve category directly from API
  const apiCategory = await catalogService.getCategoryById(slug);

  const category: CatalogCategory = apiCategory || {
    id: `cat-${slug}`,
    name: slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    slug: slug,
    is_active: true,
  };

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: category.name, url: `/category/${category.slug}` },
        ]}
      />

      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-[#18A818] border-t-transparent animate-spin" />
          </div>
        }
      >
        <CategoryPlpView
          category={category}
          initialSubcategories={[]}
          initialBrands={[]}
        />
      </Suspense>
    </>
  );
}
