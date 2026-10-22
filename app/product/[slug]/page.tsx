import React from "react";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { catalogService, isUuid } from "@/lib/api/catalog-service";
import { ProductJsonLd } from "@/components/seo/product-json-ld";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { ProductDetailView } from "@/components/product/product-detail-view";
import { formatCurrency } from "@/lib/utils";
import { SITE_CONFIG } from "@/lib/constants/site-config";
import { Product } from "@/types/product";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string; variantId?: string }>;
};

const DEFAULT_DARK_STORE_ID = "2a6ba8df-637f-4939-bc17-69ad6832c050";

const calcDiscount = (price: number, mrp: number) =>
  mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

function pickVariant(raw: any, variantId?: string) {
  const list: any[] = raw.variants ?? [];
  return (
    list.find((v) => v.id === variantId) ||
    raw.selected_variant ||
    raw.default_variant ||
    list[0] ||
    null
  );
}

// ---------- metadata ----------
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sParams = await searchParams;
  const variantParam = sParams.variantId || sParams.variant;
  const cookieStore = await cookies();
  const storeId = cookieStore.get("tiding_store_id")?.value || DEFAULT_DARK_STORE_ID;
  const raw: any = await catalogService.getProductByIdOrSlug(slug, storeId, variantParam);
  if (!raw) return { title: "Product Not Found" };

  const v = pickVariant(raw, variantParam);
  const price = v?.selling_price ?? raw.price;

  return {
    title: `${raw.name}${v?.variant_name ? ` (${v.variant_name})` : ""} - ${formatCurrency(price)} | ${SITE_CONFIG.name}`,
    description: raw.description,
    openGraph: {
      title: `${raw.name} | ${SITE_CONFIG.name}`,
      description: raw.description,
      images: raw.image_url ? [{ url: raw.image_url }] : [],
    },
  };
}

// ---------- page ----------
export default async function ProductDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sParams = await searchParams;
  const variantParam = sParams.variantId || sParams.variant;

  const cookieStore = await cookies();
  const storeId = cookieStore.get("tiding_store_id")?.value || DEFAULT_DARK_STORE_ID;

  // 1. Fetch product with variant resolution from backend with x-store-id
  const raw: any = await catalogService.getProductByIdOrSlug(slug, storeId, variantParam);
  if (!raw) notFound();

  const brandName = typeof raw.brand === "string" ? raw.brand : raw.brand?.name || "Tiding";
  const variants: any[] = raw.variants ?? [];
  const selected = pickVariant(raw, variantParam);

  // price / stock come from the resolved selected variant
  const price = selected?.selling_price ?? raw.price;
  const mrp = selected?.mrp ?? raw.mrp ?? price;

  const rawStock = selected?.stock_quantity ?? selected?.stock ?? raw.stock_quantity ?? raw.stock;
  const stock = typeof rawStock === "number" && !isNaN(rawStock) && rawStock > 0 ? rawStock : (raw.stock ?? 100);

  const isExplicitlyOOS =
    selected?.is_in_stock === false ||
    selected?.is_available === false ||
    selected?.isAvailable === false ||
    raw.is_in_stock === false ||
    raw.is_available === false ||
    raw.isAvailable === false ||
    (typeof rawStock === "number" && rawStock <= 0);

  const inStock = !isExplicitlyOOS;
  const unit = selected?.variant_name || selected?.unit || raw.unit || "1 pack";
  const discountPercentage = calcDiscount(price, mrp);

  const product: Product = {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    brand: brandName,
    description: raw.description || "",
    image_url: raw.image_url,
    images: Array.isArray(raw.images) && raw.images.length > 0
      ? raw.images
      : raw.image_url
      ? [raw.image_url]
      : [],
    category_id: raw.category_id || "",
    category_name: raw.category_name || "Daily Essentials",
    category_slug: raw.category_slug || "essentials",
    subcategory_id: raw.subcategory_id || "",
    subcategory_name: raw.subcategory_name || "",
    price,
    mrp,
    discountPercentage,
    unit,
    stock,
    isAvailable: inStock,
    deliveryEtaMinutes: raw.deliveryEtaMinutes || 8,
    rating: raw.rating || 4.8,
    ratingCount: raw.ratingCount || 120,
    selected_variant: selected
      ? {
          id: selected.id,
          sku: selected.sku,
          unit: selected.variant_name || selected.unit || unit,
          variant_name: selected.variant_name || unit,
          price: Number(selected.selling_price ?? price),
          selling_price: Number(selected.selling_price ?? price),
          mrp: Number(selected.mrp ?? mrp),
          stock: typeof selected.stock_quantity === "number" ? selected.stock_quantity : stock,
          stock_quantity: typeof selected.stock_quantity === "number" ? selected.stock_quantity : stock,
          isAvailable: selected.is_in_stock !== false && selected.is_available !== false && inStock,
          is_in_stock: selected.is_in_stock !== false && selected.is_available !== false && inStock,
          image_url: selected.image_url || raw.image_url,
          attributes: selected.attributes,
        }
      : undefined,
    default_variant: raw.default_variant
      ? {
          id: raw.default_variant.id,
          sku: raw.default_variant.sku,
          unit: raw.default_variant.variant_name || raw.default_variant.unit || unit,
          variant_name: raw.default_variant.variant_name || unit,
          price: Number(raw.default_variant.selling_price ?? price),
          selling_price: Number(raw.default_variant.selling_price ?? price),
          mrp: Number(raw.default_variant.mrp ?? mrp),
          stock: typeof raw.default_variant.stock_quantity === "number" ? raw.default_variant.stock_quantity : stock,
          stock_quantity: typeof raw.default_variant.stock_quantity === "number" ? raw.default_variant.stock_quantity : stock,
          isAvailable: raw.default_variant.is_in_stock !== false && raw.default_variant.is_available !== false && inStock,
          is_in_stock: raw.default_variant.is_in_stock !== false && raw.default_variant.is_available !== false && inStock,
          image_url: raw.default_variant.image_url || raw.image_url,
          attributes: raw.default_variant.attributes,
        }
      : undefined,
    variants: variants.map((v) => {
      const vStockRaw = v.stock_quantity ?? v.stock;
      const vStock = typeof vStockRaw === "number" && !isNaN(vStockRaw) && vStockRaw > 0 ? vStockRaw : stock;
      const vIsOOS =
        v.is_in_stock === false ||
        v.is_available === false ||
        v.isAvailable === false ||
        v.status === "INACTIVE" ||
        (typeof vStockRaw === "number" && vStockRaw <= 0);

      return {
        id: v.id,
        sku: v.sku,
        unit: v.variant_name || v.unit || "1 pack",
        variant_name: v.variant_name || v.unit || "1 pack",
        price: Number(v.selling_price ?? v.price ?? price),
        selling_price: Number(v.selling_price ?? v.price ?? price),
        mrp: Number(v.mrp ?? mrp),
        stock: vStock,
        stock_quantity: vStock,
        isAvailable: !vIsOOS,
        is_in_stock: !vIsOOS,
        image_url: v.image_url || raw.image_url,
        attributes: v.attributes,
      };
    }),
    attributes: selected?.attributes ?? raw.attributes ?? [],
  };

  // 2. Fetch similar products in category for recommendations
  const categoryProducts = await catalogService.getProducts({
    category_id: isUuid(product.category_id) ? product.category_id : undefined,
    limit: 10,
  });

  const relatedProducts: Product[] = categoryProducts
    .filter((p: any) => p.id !== product.id)
    .slice(0, 5)
    .map((p: any) => ({
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
    <>
      <ProductJsonLd product={product} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: product.category_name, url: `/category/${product.category_slug}` },
          { name: product.name, url: `/product/${product.slug}` },
        ]}
      />
      <ProductDetailView
        product={product}
        initialVariantId={variantParam || selected?.id}
        relatedProducts={relatedProducts}
      />
    </>
  );
}