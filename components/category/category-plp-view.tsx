"use client";

import React, { useMemo, useEffect, useRef, useState } from "react";
import Link from "next/link";
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
import {
  ShoppingBag,
  MapPin,
  Zap,
  ChevronRight,
  ArrowUp,
  CheckCircle2,
} from "lucide-react";

interface CategoryPlpViewProps {
  category: CatalogCategory;
  initialSubcategories?: CatalogSubcategory[];
  initialBrands?: CatalogBrand[];
}

const itemsLabel = (n: number) => `${n} ${n === 1 ? "item" : "items"}`;

function ProductSkeleton() {
  return (
    <div className="w-full max-w-[150px] animate-pulse">
      <div className="aspect-square w-full rounded-2xl bg-slate-100 dark:bg-neutral-800" />
      <div className="mt-4 h-2.5 w-10 rounded bg-slate-100 dark:bg-neutral-800" />
      <div className="mt-2 h-3 w-full rounded bg-slate-100 dark:bg-neutral-800" />
      <div className="mt-1 h-3 w-2/3 rounded bg-slate-100 dark:bg-neutral-800" />
      <div className="mt-2 h-4 w-14 rounded bg-slate-100 dark:bg-neutral-800" />
    </div>
  );
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

  // UI state
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

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

  // Valid category UUID for backend requests
  const rawCatId = searchParams.get("categoryId") || searchParams.get("category_id");
  const categoryUuid: string | undefined = isUuid(rawCatId)
    ? (rawCatId ?? undefined)
    : isUuid(resolvedCategory.id)
      ? (resolvedCategory.id ?? undefined)
      : isUuid(category.id)
        ? (category.id ?? undefined)
        : undefined;

  // 2. Subcategories
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

  const subcategoryUuid = isUuid(activeSubcategory?.id) ? activeSubcategory.id : undefined;

  // 3. Dark store ID
  const storeId: string =
    location?.darkStoreId && isUuid(location.darkStoreId)
      ? location.darkStoreId
      : "b226dc17-f384-4068-8c64-cbebad3c91df";

  const { data: inventoryData } = useStoreInventoryQuery(storeId);

  // 4. Fetch products
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
        reviews_count: p.ratingCount || 120,
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

  // Out of stock items always go to the end of the list
  const displayProducts = useMemo(() => {
    const isOut = (pr: Product) =>
      pr.isAvailable === false || (typeof pr.stock === "number" && pr.stock <= 0);
    return [...products].sort((a, b) => Number(isOut(a)) - Number(isOut(b)));
  }, [products]);

  // Clean URL
  useEffect(() => {
    if (searchParams.has("categoryId") || searchParams.has("category_id")) {
      const cleanParams = new URLSearchParams();
      if (subParam) {
        cleanParams.set("sub", subParam);
      }
      const query = cleanParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  }, [pathname, searchParams, subParam, router]);

  const handleSelectSubcategory = (subId: string, slug: string) => {
    const cleanSub = slug || subId;
    if (cleanSub) {
      router.replace(`${pathname}?sub=${cleanSub}`, { scroll: false });
    } else {
      router.replace(pathname, { scroll: false });
    }
  };

  // Scroll product panel to top when subcategory changes
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeSubcategory?.id]);

  // Scroll handler: compact header, back-to-top button, progress line
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const isScrolled = el.scrollTop > 12;
    const isFar = el.scrollTop > 500;
    setScrolled((prev) => (prev === isScrolled ? prev : isScrolled));
    setShowTop((prev) => (prev === isFar ? prev : isFar));

    // Update the progress line without re-rendering the cards
    const max = el.scrollHeight - el.clientHeight;
    if (progressRef.current) {
      progressRef.current.style.transform = `scaleX(${max > 0 ? el.scrollTop / max : 0})`;
    }
  };

  const [headerHeight, setHeaderHeight] = React.useState(75);

  // Measure header height & lock outer body scroll
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

  const eta = location?.deliveryEtaMinutes || 15;
  const title = activeSubcategory?.name || resolvedCategory.name;
  const outOfStockCount = displayProducts.filter(
    (pr) => pr.isAvailable === false || (typeof pr.stock === "number" && pr.stock <= 0)
  ).length;
  const inStockCount = displayProducts.length - outOfStockCount;

  const gridClass =
    "grid grid-cols-[repeat(auto-fill,minmax(130px,150px))] justify-center gap-x-3 gap-y-7 sm:justify-start sm:gap-x-4 md:gap-x-5";

  return (
    <div
      style={{ height: `calc(100dvh - ${headerHeight}px)` }}
      className="flex w-full flex-col overflow-hidden bg-gradient-to-b from-[#EEF3F0] to-[#F4F6F8] p-2 dark:from-neutral-950 dark:to-neutral-950 sm:p-3 md:p-3.5"
    >
      <div className="mx-auto flex h-full w-full max-w-7xl flex-row overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)] dark:border-neutral-800 dark:bg-neutral-900">
        {/* Left Subcategory Rail */}
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

        {/* Right Product Panel */}
        <div className="relative h-full min-w-0 flex-1">
          <div
            ref={panelRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto bg-[#FBFCFB] px-3.5 pb-24 dark:bg-neutral-900 sm:px-5 md:px-6"
          >
            {/* STICKY HEADER (gets compact when you scroll) */}
            <div
              className={`sticky top-0 z-30 -mx-3.5 mb-5 border-b border-slate-100 bg-white/90 px-3.5 backdrop-blur-md transition-all duration-300 dark:border-neutral-800 dark:bg-neutral-900/90 sm:-mx-5 sm:px-5 md:-mx-6 md:px-6 ${scrolled
                  ? "py-2 shadow-[0_6px_16px_-10px_rgba(15,23,42,0.25)]"
                  : "pb-3.5 pt-3.5 sm:pt-5"
                }`}
            >
              {/* Breadcrumb (hides when scrolled) */}
              <nav
                aria-label="Breadcrumb"
                className={`flex items-center gap-1 overflow-hidden text-[11px] font-semibold text-slate-400 transition-all duration-300 ${scrolled ? "mb-0 max-h-0 opacity-0" : "mb-1.5 max-h-5 opacity-100"
                  }`}
              >
                <Link href="/" className="hover:text-[#18A818]">
                  Home
                </Link>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <Link
                  href={`/category/${resolvedCategory.slug}`}
                  className="max-w-[40%] truncate hover:text-[#18A818]"
                >
                  {resolvedCategory.name}
                </Link>
                {activeSubcategory?.name && (
                  <>
                    <ChevronRight className="h-3 w-3 shrink-0" />
                    <span className="truncate text-slate-600">
                      {activeSubcategory.name}
                    </span>
                  </>
                )}
              </nav>

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1
                      className={`truncate font-black tracking-tight text-[var(--text-primary)] transition-all duration-300 ${scrolled
                          ? "text-base sm:text-lg"
                          : "text-lg sm:text-xl md:text-2xl"
                        }`}
                    >
                      {title}
                    </h1>
                    <span
                      suppressHydrationWarning
                      className="shrink-0 rounded-full bg-[#18A818]/10 px-2 py-0.5 text-[11px] font-bold text-[#18A818]"
                    >
                      {itemsLabel(displayProducts.length)}
                    </span>
                  </div>

                  {/* Store line (hides when scrolled) */}
                  <div
                    suppressHydrationWarning
                    className={`flex items-center gap-2 overflow-hidden text-xs font-medium text-[var(--text-muted)] transition-all duration-300 ${scrolled ? "max-h-0 opacity-0" : "mt-1 max-h-5 opacity-100"
                      }`}
                  >
                    <span className="flex min-w-0 items-center gap-1" suppressHydrationWarning>
                      <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                      <span className="truncate" suppressHydrationWarning>
                        {location?.darkStoreName || "Express Hub"}
                      </span>
                    </span>
                    {!isProductsLoading && outOfStockCount > 0 && (
                      <span className="shrink-0 text-slate-400" suppressHydrationWarning>
                        · {inStockCount} available
                      </span>
                    )}
                  </div>
                </div>

                {/* ETA pill with a live pulse */}
                <span
                  suppressHydrationWarning
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#18A818] to-[#2BC12B] px-3 py-1.5 text-[11px] font-extrabold text-white shadow-sm sm:text-xs"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                  </span>
                  <Zap className="h-3.5 w-3.5 fill-white" />
                  <span suppressHydrationWarning>{eta} mins</span>
                </span>
              </div>

              {/* Scroll progress line */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-transparent">
                <div
                  ref={progressRef}
                  className="h-full origin-left scale-x-0 bg-[#18A818]"
                />
              </div>
            </div>

            {/* PRODUCT GRID */}
            {isProductsLoading ? (
              <div className={gridClass}>
                {Array.from({ length: 14 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : displayProducts.length > 0 ? (
              <>
                <div className={gridClass}>
                  {displayProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* End of list (only for longer lists) */}
                {displayProducts.length >= 8 && (
                  <div className="mt-10 flex flex-col items-center gap-1.5 text-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#18A818]/10 text-[#18A818]">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <p className="text-xs font-bold text-slate-600">
                      You&apos;ve seen all {itemsLabel(displayProducts.length)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Pick another subcategory from the left to keep shopping
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3 py-24 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-slate-100 to-slate-50 text-slate-400 ring-8 ring-slate-50">
                  <ShoppingBag className="h-9 w-9" />
                </div>
                <h3 className="text-base font-bold text-slate-700">No products found</h3>
                <p className="max-w-xs text-xs text-slate-400">
                  No items are available in this subcategory for the selected store.
                </p>
              </div>
            )}
          </div>

          {/* BACK TO TOP */}
          <button
            onClick={() =>
              panelRef.current?.scrollTo({ top: 0, behavior: "smooth" })
            }
            aria-label="Back to top"
            className={`absolute bottom-20 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-all duration-300 hover:bg-[#18A818] active:scale-90 sm:right-6 ${showTop
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-4 opacity-0"
              }`}
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}