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
const DEFAULT_STOCK = 99; // API doesn't send stock yet

const calcDiscount = (price: number, mrp: number) =>
  mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

// Works whether the service returns the envelope ({success, data}) or just data
function unwrap(res: any) {
  if (res && typeof res === "object" && res.data && res.data.id) return res.data;
  return res;
}

// images: [{image_url, is_primary, display_order}] -> string[] (primary first)
function toImageUrls(imgs: any[] | undefined, singleUrl?: string): string[] {
  const list = (imgs ?? [])
    .slice()
    .sort(
      (a, b) =>
        (b?.is_primary ? 1 : 0) - (a?.is_primary ? 1 : 0) ||
        (a?.display_order ?? 0) - (b?.display_order ?? 0)
    )
    .map((i) => (typeof i === "string" ? i : i?.image_url))
    .filter(Boolean);

  if (singleUrl && !list.includes(singleUrl)) {
    list.unshift(singleUrl);
  }
  return list;
}

function pickVariant(raw: any, variantId?: string) {
  const list: any[] = raw.variants ?? [];
  return (
    list.find((v) => v.id === variantId) ||
    list.find((v) => v.id === raw.selected_variant_id) ||
    list.find((v) => v.id === raw.default_variant_id) ||
    list.find((v) => v.is_default) ||
    list.find((v) => v.status === "ACTIVE") ||
    list[0] ||
    null
  );
}

function mapVariant(v: any, fallbackImage?: string) {
  const single = typeof v.image_url === "string" ? v.image_url : undefined;
  const imgs = toImageUrls(v.images, single);
  const variantImg = imgs[0] ?? single ?? fallbackImage;
  const allImgs = imgs.length > 0 ? imgs : (variantImg ? [variantImg] : []);
  const attr = v.attributes?.[0];
  const unit: string = attr?.display_value || attr?.value || v.unit || v.variant_name || "1 pack";

  const rawStock = v.stock_quantity ?? v.stock;
  const hasStock = typeof rawStock === "number" && !isNaN(rawStock);
  const oos =
    v.is_in_stock === false ||
    v.is_available === false ||
    v.isAvailable === false ||
    (v.status && v.status !== "ACTIVE") ||
    (hasStock && rawStock <= 0);
  const stock = hasStock ? rawStock : DEFAULT_STOCK;
  const selling = Number(v.selling_price ?? v.price ?? 0);

  return {
    id: v.id,
    sku: v.sku,
    barcode: v.barcode,
    unit,
    variant_name: unit, // clean label e.g. "250 g"
    full_name: v.variant_name,
    price: selling,
    selling_price: selling,
    mrp: Number(v.mrp ?? selling),
    weight_in_grams: v.weight_in_grams,
    stock,
    stock_quantity: stock,
    isAvailable: !oos,
    is_in_stock: !oos,
    image_url: variantImg,
    images: allImgs,
    attributes: v.attributes ?? [],
  };
}

// ---------- metadata ----------
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sParams = await searchParams;
  const variantParam = sParams.variantId || sParams.variant;
  const cookieStore = await cookies();
  const storeId = cookieStore.get("tiding_store_id")?.value || DEFAULT_DARK_STORE_ID;
  const raw: any = unwrap(await catalogService.getProductByIdOrSlug(slug, storeId, variantParam));
  if (!raw) return { title: "Product Not Found" };

  const v = pickVariant(raw, variantParam);
  const price = v?.selling_price ?? raw.price;
  const image = toImageUrls(v?.images)[0] ?? toImageUrls(raw.variants?.flatMap((x: any) => x.images ?? []))[0];

  return {
    title: `${raw.name} - ${formatCurrency(price)} | ${SITE_CONFIG.name}`,
    description: raw.description,
    openGraph: {
      title: `${raw.name} | ${SITE_CONFIG.name}`,
      description: raw.description,
      images: image ? [{ url: image }] : [],
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

  const raw: any = unwrap(await catalogService.getProductByIdOrSlug(slug, storeId, variantParam));
  if (!raw) notFound();

  const brandName = typeof raw.brand === "string" ? raw.brand : raw.brand?.name || "Tiding";
  const rawVariants: any[] = raw.variants ?? [];
  const selectedRaw = pickVariant(raw, variantParam);

  // Product-level base images (not merging every other variant's images)
  const productBaseImages = toImageUrls(raw.images, raw.image_url);
  const selectedVariantImages = toImageUrls(selectedRaw?.images, selectedRaw?.image_url);
  const mainImage = selectedVariantImages[0] || productBaseImages[0] || raw.image_url;

  const variants = rawVariants.map((v) => mapVariant(v, mainImage));
  const selected = variants.find((v) => v.id === selectedRaw?.id) ?? variants[0];
  const defaultVariant = variants.find((v) => v.id === raw.default_variant_id) ?? variants.find((_, i) => rawVariants[i].is_default);

  const price = selected?.selling_price ?? raw.price ?? 0;
  const mrp = selected?.mrp ?? raw.mrp ?? price;
  const inStock = selected ? selected.isAvailable : raw.is_active !== false;

  const category = raw.category ?? {};
  const subcategory = raw.subcategory ?? {};
  const categoryId = category.id ?? raw.category_id ?? "";

  const product = {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    brand: brandName,
    description: raw.description || "",
    image_url: mainImage,
    images: productBaseImages.length > 0 ? productBaseImages : (mainImage ? [mainImage] : []),
    category_id: categoryId,
    category_name: category.name ?? raw.category_name ?? "Daily Essentials",
    category_slug: category.slug ?? raw.category_slug ?? "essentials",
    subcategory_id: subcategory.id ?? raw.subcategory_id ?? "",
    subcategory_name: subcategory.name ?? raw.subcategory_name ?? "",
    price,
    mrp,
    discountPercentage: calcDiscount(price, mrp),
    unit: selected?.unit ?? raw.unit ?? "1 pack",
    stock: selected?.stock ?? DEFAULT_STOCK,
    isAvailable: inStock,
    deliveryEtaMinutes: raw.deliveryEtaMinutes || 8,
    // only real ratings are shown; no fake fallback
    rating: raw.rating ?? undefined,
    ratingCount: raw.ratingCount ?? undefined,
    is_veg: raw.food_preference ? raw.food_preference !== "NON_VEG" : true,
    food_preference: raw.food_preference,
    product_type: raw.product_type,
    tags: raw.tags ?? [],
    selected_variant: selected,
    default_variant: defaultVariant,
    variants,
    attributes: selected?.attributes ?? [],
  } as unknown as Product;

  // Similar products
  const categoryProducts = await catalogService.getProducts({
    category_id: isUuid(categoryId) ? categoryId : undefined,
    limit: 10,
  });

  const relatedProducts: Product[] = (categoryProducts ?? [])
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
      rating: p.rating,
      ratingCount: p.ratingCount,
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