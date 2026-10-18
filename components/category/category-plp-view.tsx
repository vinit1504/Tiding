"use client";

import React, { useMemo, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAtomValue } from "jotai";
import { deliveryLocationAtom } from "@/stores/location-atom";
import { CatalogCategory, CatalogSubcategory, CatalogBrand } from "@/types/catalog";
import { Product } from "@/types/product";
import { SubcategorySidebar } from "./subcategory-sidebar";
import { ProductCard } from "@/components/product/product-card";
import {
  useCategoriesQuery,
  useInfiniteSubcategoriesQuery,
  useCatalogProductsQuery,
} from "@/queries/catalog";
import { useStoreInventoryQuery } from "@/queries/inventory";
import { isUuid } from "@/lib/api/catalog-service";
import { ShoppingBag } from "lucide-react";

interface CategoryPlpViewProps {
  category: CatalogCategory;
  initialSubcategories?: CatalogSubcategory[];
  initialBrands?: CatalogBrand[];
}

export function CategoryPlpView({
  category,
  initialSubcategories = [],
}: CategoryPlpViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const location = useAtomValue(deliveryLocationAtom);

  const subParam = searchParams.get("sub");

  // 1. Fetch categories to resolve real backend UUID if current category only has a slug
  const { data: allCategories } = useCategoriesQuery();
  const resolvedCategory = useMemo(() => {
    const slugMap: Record<string, string> = {
      "dairy-breakfast": "dairy-bread-eggs",
      "dairy-bread-eggs": "dairy-bread-eggs",
      "fruits-vegetables": "vegetables-fruits",
      "vegetables": "vegetables-fruits",
      "fruits": "vegetables-fruits",
      "vegetables-fruits": "vegetables-fruits",
      "staples": "atta-rice-dal",
      "atta-rice-dal": "atta-rice-dal",
      "bakery-breads": "bakery-biscuits",
      "bakery-biscuits": "bakery-biscuits",
      "cold-drinks-juices": "cold-drinks-juices",
      "beverages": "cold-drinks-juices",
      "tea-coffee": "tea-coffee-health-drinks",
      "tea-coffee-health-drinks": "tea-coffee-health-drinks",
      "snacks-munchies": "snacks-munchies",
      "snacks": "snacks-munchies",
    };

    const targetSlug = slugMap[category.slug] || category.slug;
    const matched = allCategories?.find(
      (c) =>
        c.slug === targetSlug ||
        c.slug === category.slug ||
        c.slug.replace(/-/g, "").includes(targetSlug.replace(/-/g, "")) ||
        (isUuid(category.id) && c.id === category.id)
    );
    return matched || category;
  }, [allCategories, category]);

  // Valid category UUID for backend requests (check query params first, then resolved category)
  const rawCatId = searchParams.get("categoryId") || searchParams.get("category_id");
  const categoryUuid: string | undefined = isUuid(rawCatId)
    ? (rawCatId ?? undefined)
    : isUuid(resolvedCategory.id)
      ? (resolvedCategory.id ?? undefined)
      : isUuid(category.id)
        ? (category.id ?? undefined)
        : undefined;

  // 2. Fetch subcategories for current category with limit 20 and scrollable pagination
  const {
    data: infiniteSubcategoriesData,
    isLoading: isSubcategoriesLoading,
    hasNextPage: hasSubcategoriesNextPage,
    isFetchingNextPage: isFetchingSubcategoriesNextPage,
    fetchNextPage: fetchNextSubcategoriesPage,
  } = useInfiniteSubcategoriesQuery({
    category_id: categoryUuid,
    limit: 20,
  });

  const subcategories = useMemo(() => {
    if (infiniteSubcategoriesData?.pages) {
      const flattened = infiniteSubcategoriesData.pages.flatMap((page) => page.data);
      if (flattened.length > 0) return flattened;
    }
    return initialSubcategories;
  }, [infiniteSubcategoriesData, initialSubcategories]);

  // Active subcategory: match by slug or id
  const activeSubcategory = useMemo(() => {
    if (subParam) {
      const match = subcategories.find(
        (s) =>
          s.slug === subParam ||
          s.id === subParam ||
          s.slug.toLowerCase().includes(subParam.toLowerCase()) ||
          subParam.toLowerCase().includes(s.slug.toLowerCase())
      );
      if (match) return match;
    }
    return subcategories[0] || null;
  }, [subParam, subcategories]);

  // Valid subcategory UUID
  const subcategoryUuid = isUuid(activeSubcategory?.id) ? activeSubcategory.id : undefined;

  // 3. Dark store ID (prioritize real UUID matching backend)
  const storeId: string =
    location?.darkStoreId && isUuid(location.darkStoreId)
      ? location.darkStoreId
      : "b226dc17-f384-4068-8c64-cbebad3c91df";

  const { data: inventoryData } = useStoreInventoryQuery(storeId);

  // 4. Fetch products with strictly validated UUID parameters matching curl:
  // categoryId, subcategoryId, storeId
  const { data: rawProducts, isLoading: isProductsLoading } = useCatalogProductsQuery({
    categoryId: categoryUuid,
    category_id: categoryUuid,
    subcategoryId: subcategoryUuid,
    subcategory_id: subcategoryUuid,
    storeId: storeId,
    store_id: storeId,
    page: 1,
    limit: 20,
  });

  // 5. Map products directly from API response
  const products: Product[] = useMemo(() => {
    if (!rawProducts || !Array.isArray(rawProducts)) return [];

    return rawProducts.map((p) => {
      const invMatch = inventoryData?.find(
        (inv) => inv.product_variant_id === p.id || inv.product_variant_id === p.slug
      );

      const effectiveStock = invMatch ? invMatch.stock_quantity : (p.stock || 20);
      const effectiveAvailability = invMatch ? invMatch.is_available : (p.isAvailable ?? true);

      const price = Number(p.price || 0);
      const mrp = Number(p.mrp || price);
      const discountPercentage = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : (p.discountPercentage || 0);

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: typeof p.brand === "string" ? p.brand : p.brand?.name || "Tiding",
        description: p.description || "",
        image_url: p.image_url,
        images: p.images?.map((img: any) => (typeof img === "string" ? img : img.image_url)) || (p.image_url ? [p.image_url] : []),
        category_id: p.category_id || categoryUuid || "",
        category_name: p.category_name || resolvedCategory.name,
        category_slug: p.category_slug || resolvedCategory.slug,
        subcategory_id: p.subcategory_id || subcategoryUuid || "",
        subcategory_name: p.subcategory_name || activeSubcategory?.name || "",
        price,
        mrp,
        discountPercentage,
        unit: p.unit || "1 pack",
        stock: effectiveStock,
        isAvailable: effectiveAvailability,
        deliveryEtaMinutes: p.deliveryEtaMinutes || location?.deliveryEtaMinutes || 15,
        rating: p.rating || 4.8,
        ratingCount: p.ratingCount || 120,
        variants: p.variants?.map((v: any) => ({
          id: v.id,
          sku: v.sku || v.id,
          unit: v.variant_name || v.unit || p.unit || "1 pack",
          price: Number(v.selling_price || price),
          mrp: Number(v.mrp || mrp),
          discountPercentage: v.mrp > v.selling_price ? Math.round(((v.mrp - v.selling_price) / v.mrp) * 100) : 0,
          stock: v.stock_quantity || 10,
          isAvailable: v.is_available ?? v.is_in_stock ?? true,
          image_url: v.image_url,
        })),
      };
    });
  }, [
    rawProducts,
    inventoryData,
    categoryUuid,
    subcategoryUuid,
    resolvedCategory,
    activeSubcategory,
    location,
  ]);

  // Handler for subcategory click
  const handleSelectSubcategory = (subId: string, slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sub", slug || subId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [headerHeight, setHeaderHeight] = React.useState(75);

  // Measure exact header height dynamically & lock outer body scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const header = document.querySelector("header");
    if (header) {
      const updateHeight = () => {
        const rect = header.getBoundingClientRect();
        if (rect.height > 0) {
          setHeaderHeight(rect.height);
        }
      };
      updateHeight();
      const ro = new ResizeObserver(updateHeight);
      ro.observe(header);

      return () => {
        ro.disconnect();
        document.body.style.overflow = originalOverflow;
      };
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div
      style={{ height: `calc(100dvh - ${headerHeight}px)` }}
      className="w-full bg-[#F4F6F8] dark:bg-neutral-950 p-2 sm:p-3 md:p-3.5 flex flex-col overflow-hidden"
    >
      {/* Unified Fixed Viewport-Height Box Container: Subcategory Sidebar + Product Shelf */}
      <div className="mx-auto w-full max-w-7xl h-full rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden flex flex-row">
        {/* Left Subcategory Rail with reduced compact icons */}
        <SubcategorySidebar
          subcategories={subcategories}
          selectedSubcategoryId={activeSubcategory?.slug || activeSubcategory?.id}
          onSelectSubcategory={handleSelectSubcategory}
          isLoading={isSubcategoriesLoading}
          hasNextPage={hasSubcategoriesNextPage}
          isFetchingNextPage={isFetchingSubcategoriesNextPage}
          onLoadMore={fetchNextSubcategoriesPage}
          className="h-full"
        />

        {/* Right Main Product Panel with proper padding and shelf display */}
        <div className="flex-1 h-full min-w-0 p-3.5 sm:p-5 md:p-6 overflow-y-auto pb-24">
          {/* Subcategory Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 mb-5 border-b border-slate-100 dark:border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl md:text-2xl font-black text-[var(--text-primary)] tracking-tight">
                  {activeSubcategory?.name ? `${activeSubcategory.name} Online` : resolvedCategory.name}
                </h1>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                  {products.length}
                </span>
              </div>
              <p
                suppressHydrationWarning
                className="text-xs text-[var(--text-muted)] font-medium mt-1"
              >
                Delivered in {location?.deliveryEtaMinutes || 15} mins from{" "}
                {location?.darkStoreName || "Express Hub"}
              </p>
            </div>
            <span
              suppressHydrationWarning
              className="text-xs font-bold text-[#18A818] hidden sm:inline-flex items-center gap-1.5 bg-[#18A818]/10 px-3 py-1.5 rounded-full self-start sm:self-auto"
            >
              ⚡ Delivery in {location?.deliveryEtaMinutes || 15} mins
            </span>
          </div>

          {/* Proper Product Shelf Grid with compact card sizes matching Home Screen shelves */}
          {isProductsLoading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,138px))] gap-2.5 sm:gap-3 md:gap-3.5">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-1.5 animate-pulse max-w-[138px]">
                  <div className="aspect-square w-full rounded-xl bg-slate-100 dark:bg-neutral-800" />
                  <div className="h-3.5 w-12 bg-slate-100 dark:bg-neutral-800 rounded" />
                  <div className="h-3 w-full bg-slate-100 dark:bg-neutral-800 rounded" />
                  <div className="h-2.5 w-14 bg-slate-100 dark:bg-neutral-800 rounded" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,138px))] gap-2.5 sm:gap-3 md:gap-3.5">
              {products.map((product) => (
                <div key={product.id} className="w-full max-w-[138px]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center flex flex-col items-center justify-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-slate-700">No products found</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                No items currently available in this subcategory for the selected store.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
