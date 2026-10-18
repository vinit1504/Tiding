import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { catalogService, isUuid } from "@/lib/api/catalog-service";
import { ProductJsonLd } from "@/components/seo/product-json-ld";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { ProductCard } from "@/components/product/product-card";
import { formatCurrency } from "@/lib/utils";
import { SITE_CONFIG } from "@/lib/constants/site-config";
import { Zap, ShieldCheck, Award, Star, Truck, ArrowLeft, Package } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { Product } from "@/types/product";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await catalogService.getProductByIdOrSlug(slug);
  if (!product) return { title: "Product Not Found" };

  return {
    title: `${product.name} (${product.unit}) - ${formatCurrency(product.price)}`,
    description: product.description,
    openGraph: {
      title: `${product.name} | ${SITE_CONFIG.name}`,
      description: product.description,
      images: [{ url: product.image_url }],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rawProduct = await catalogService.getProductByIdOrSlug(slug);

  if (!rawProduct) {
    notFound();
  }

  const brandName = typeof rawProduct.brand === "string" ? rawProduct.brand : rawProduct.brand?.name || "Tiding";
  const product: Product = {
    id: rawProduct.id,
    name: rawProduct.name,
    slug: rawProduct.slug,
    brand: brandName,
    description: rawProduct.description || "",
    image_url: rawProduct.image_url,
    category_id: rawProduct.category_id || "",
    category_name: rawProduct.category_name || "Daily Essentials",
    category_slug: rawProduct.category_slug || "essentials",
    subcategory_id: rawProduct.subcategory_id || "",
    subcategory_name: rawProduct.subcategory_name || "",
    price: rawProduct.price,
    mrp: rawProduct.mrp,
    discountPercentage: rawProduct.discountPercentage || 0,
    unit: rawProduct.unit || "1 pack",
    stock: rawProduct.stock,
    isAvailable: rawProduct.isAvailable,
    deliveryEtaMinutes: rawProduct.deliveryEtaMinutes || 8,
    rating: rawProduct.rating || 4.8,
    ratingCount: rawProduct.ratingCount || 120,
    variants: rawProduct.variants?.map((v) => ({
      id: v.id,
      sku: v.sku,
      unit: v.variant_name || v.unit || "1 pack",
      price: v.selling_price,
      mrp: v.mrp,
      stock: v.stock_quantity || 10,
      isAvailable: v.is_available ?? true,
    })),
  };

  const allCategoryProducts = await catalogService.getProducts({
    category_id: isUuid(product.category_id) ? product.category_id : undefined,
    limit: 10,
  });

  const relatedProducts: Product[] = allCategoryProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: typeof p.brand === "string" ? p.brand : p.brand?.name || "Tiding",
      description: p.description || "",
      image_url: p.image_url,
      category_id: p.category_id || product.category_id,
      category_name: p.category_name || product.category_name,
      category_slug: p.category_slug || product.category_slug,
      subcategory_id: p.subcategory_id || "",
      subcategory_name: p.subcategory_name || "",
      price: p.price,
      mrp: p.mrp,
      discountPercentage: p.discountPercentage || 0,
      unit: p.unit || "1 pack",
      stock: p.stock,
      isAvailable: p.isAvailable,
      deliveryEtaMinutes: p.deliveryEtaMinutes || 8,
      rating: p.rating || 4.8,
      ratingCount: p.ratingCount || 120,
    }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-10">
      {/* Schema.org Structured Data */}
      <ProductJsonLd product={product} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: product.category_name, url: `/category/${product.category_slug}` },
          { name: product.name, url: `/product/${product.slug}` },
        ]}
      />

      {/* Back Button */}
      <Link
        href={`/category/${product.category_slug}`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[#18A818] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to {product.category_name}</span>
      </Link>

      {/* Product Detail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: Product Media Gallery */}
        <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-[var(--surface-secondary)]/50 border border-[var(--border)] shadow-xs">
          {product.discountPercentage > 0 && (
            <span className="absolute left-4 top-4 z-10 rounded-xl bg-[#18A818] px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-md">
              {product.discountPercentage}% OFF
            </span>
          )}
          <span className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-xl bg-black/70 backdrop-blur-md px-3 py-1 text-xs font-bold text-white">
            <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            10 MINS DELIVERY
          </span>
          <SafeImage
            src={product.image_url}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-6"
            fallback={
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-neutral-900 text-slate-400 select-none p-6 text-center">
                <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                  <Package className="h-10 w-10 text-slate-300 dark:text-neutral-600 stroke-[1.5]" />
                </div>
                <p className="text-sm font-bold text-slate-500">Image not available</p>
                <p className="text-xs text-slate-400 mt-1">{product.name}</p>
              </div>
            }
          />
        </div>

        {/* Right: Product Buy Box & Details */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Category / Brand Badge */}
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--surface-secondary)] px-2.5 py-0.5 text-xs font-bold text-[var(--text-secondary)] border border-[var(--border)]">
                {product.brand || product.category_name}
              </span>
              {product.badge && (
                <span className="rounded-full bg-[#18A818]/15 px-2.5 py-0.5 text-xs font-bold text-[#18A818]">
                  {product.badge}
                </span>
              )}
            </div>

            {/* Title & Unit */}
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight leading-snug">
              {product.name}
            </h1>
            <p className="text-sm font-semibold text-[var(--text-muted)]">
              Net Quantity: <span className="text-[var(--text-primary)]">{product.unit}</span>
            </p>

            {/* Rating */}
            {(product.rating || 0) > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1 rounded-lg bg-amber-500/15 px-2 py-1 font-bold text-amber-700 dark:text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>{product.rating}</span>
                </div>
                <span className="text-[var(--text-muted)]">({product.ratingCount || 120} verified ratings)</span>
              </div>
            )}

            {/* Pricing Box */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-3xl font-black text-[var(--text-primary)]">
                {formatCurrency(product.price)}
              </span>
              {product.mrp > product.price && (
                <span className="text-base text-[var(--text-muted)] line-through">
                  MRP {formatCurrency(product.mrp)}
                </span>
              )}
              {product.discountPercentage > 0 && (
                <span className="text-xs font-black text-[#18A818] bg-[#18A818]/10 px-2 py-0.5 rounded-full">
                  Save {formatCurrency(product.mrp - product.price)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              (Inclusive of all taxes)
            </p>

            {/* Add to Cart Stepper Box */}
            <div className="pt-4 max-w-sm">
              <ProductCard product={product} />
            </div>

            {/* Delivery Guarantee Highlights */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[var(--border-light)] text-xs">
              <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] p-3">
                <Truck className="h-5 w-5 text-[#18A818] shrink-0" />
                <div>
                  <p className="font-bold text-[var(--text-primary)]">10-15 Min Delivery</p>
                  <p className="text-[10px] text-[var(--text-muted)]">From dark store near you</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] p-3">
                <ShieldCheck className="h-5 w-5 text-[#18A818] shrink-0" />
                <div>
                  <p className="font-bold text-[var(--text-primary)]">Best Quality</p>
                  <p className="text-[10px] text-[var(--text-muted)]">100% genuine products</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Details Tab Section */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <h2 className="text-base font-bold text-[var(--text-primary)]">About the Product</h2>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {product.description || "Fresh and verified quality grocery item directly sourced and stored under temperature-controlled hygiene standards."}
        </p>
      </div>

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Similar Products in this Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {relatedProducts.map((relProduct) => (
              <ProductCard key={relProduct.id} product={relProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
