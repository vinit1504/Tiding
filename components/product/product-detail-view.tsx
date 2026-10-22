"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { SafeImage } from "@/components/ui/safe-image";
import { Product } from "@/types/product";
import { toast } from "sonner";
import {
  Zap,
  ShieldCheck,
  Star,
  Truck,
  ArrowLeft,
  Package,
  Check,
  Leaf,
  BadgePercent,
  Plus,
  Minus,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { useProductDetailQuery } from "@/queries";

interface ProductDetailViewProps {
  product: Product;
  initialVariantId?: string;
  relatedProducts?: Product[];
}

type Attr = { attribute_name: string; value: string };

// One clean shape for every variant, whatever the API / mapper returns
type NVariant = {
  id: string;
  raw: any | null; // original variant object (null = product-level fallback)
  name: string;
  sku?: string;
  price: number;
  mrp: number;
  stock: number;
  inStock: boolean;
  image?: string;
  attributes: Attr[];
};

const calcDiscount = (price: number, mrp: number) =>
  mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

function normalizeVariant(v: any, fallbackImage?: string, defaultStock = 100): NVariant {
  const price = Number(v.selling_price ?? v.price ?? 0);
  const stockRaw = v.stock_quantity ?? v.stock;
  const parsedStock =
    stockRaw !== undefined && stockRaw !== null && !isNaN(Number(stockRaw))
      ? Number(stockRaw)
      : defaultStock;
  const stock = Math.max(0, parsedStock);

  // Check explicit out-of-stock flags
  const isOutOfStock =
    v.is_in_stock === false ||
    v.is_available === false ||
    v.isAvailable === false ||
    v.status === "INACTIVE" ||
    (stockRaw !== undefined && stockRaw !== null && parsedStock <= 0);

  const inStock = !isOutOfStock;

  return {
    id: v.id,
    raw: v,
    name: v.variant_name || v.unit || "",
    sku: v.sku,
    price,
    mrp: Number(v.mrp ?? price),
    stock,
    inStock,
    image: v.image_url || fallbackImage,
    attributes: Array.isArray(v.attributes) ? v.attributes : [],
  };
}

export function ProductDetailView({
  product,
  initialVariantId,
  relatedProducts = [],
}: ProductDetailViewProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { items, addToCart, updateQuantity } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const queryVariantId = searchParams.get("variant") || searchParams.get("variantId") || initialVariantId;

  const [selectedVariantId, setSelectedVariantId] = useState<string>(() => {
    return (
      queryVariantId ||
      initialVariantId ||
      (product as any).selected_variant?.id ||
      (product as any).default_variant?.id ||
      (Array.isArray(product.variants) && product.variants[0]?.id) ||
      ""
    );
  });

  // Client-side query: calls GET /api/v1/catalog/products/:slug?variantId=... with x-store-id header on mount & variant change
  const { data: liveProduct } = useProductDetailQuery(
    product.slug || product.id,
    selectedVariantId || queryVariantId || undefined,
    product
  );

  const effectiveProduct = liveProduct || product;

  // Sync when the URL changes (back/forward or shared link)
  useEffect(() => {
    if (queryVariantId && queryVariantId !== selectedVariantId) {
      setSelectedVariantId(queryVariantId);
    }
  }, [queryVariantId]);

  // ---------- variants ----------
  const variants = useMemo<NVariant[]>(() => {
    const rawVariants: any[] = Array.isArray(effectiveProduct.variants) ? effectiveProduct.variants : [];
    const selVariant = (effectiveProduct as any).selected_variant;
    const defVariant = (effectiveProduct as any).default_variant;

    let list = rawVariants;
    if (list.length === 0) {
      if (selVariant) list = [selVariant];
      else if (defVariant) list = [defVariant];
    }

    const fallbackStock =
      typeof effectiveProduct.stock === "number" && effectiveProduct.stock > 0
        ? effectiveProduct.stock
        : typeof (effectiveProduct as any).stock_quantity === "number" && (effectiveProduct as any).stock_quantity > 0
        ? (effectiveProduct as any).stock_quantity
        : 100;

    return list.map((v: any) => {
      // Find matching variant details from selected_variant or default_variant
      const match =
        selVariant?.id === v.id
          ? selVariant
          : defVariant?.id === v.id
          ? defVariant
          : null;

      const attrs: Attr[] =
        Array.isArray(v.attributes) && v.attributes.length > 0
          ? v.attributes
          : Array.isArray(match?.attributes) && match.attributes.length > 0
          ? match.attributes
          : [{ attribute_name: "Pack Size", value: v.variant_name || v.unit || "1 pack" }];

      const enriched = {
        ...match,
        ...v,
        stock_quantity: v.stock_quantity ?? match?.stock_quantity ?? v.stock ?? match?.stock,
        is_in_stock: v.is_in_stock ?? match?.is_in_stock ?? v.is_available ?? match?.is_available,
        sku: v.sku || match?.sku,
        slug: v.slug || match?.slug,
        attributes: attrs,
      };
      return normalizeVariant(enriched, effectiveProduct.image_url, fallbackStock);
    });
  }, [
    effectiveProduct.variants,
    (effectiveProduct as any).selected_variant,
    (effectiveProduct as any).default_variant,
    effectiveProduct.image_url,
    effectiveProduct.stock,
    (effectiveProduct as any).stock_quantity,
  ]);

  // The one variant everything below reads from
  const active: NVariant = useMemo(() => {
    const found = variants.find((v) => v.id === selectedVariantId);
    if (found) return found;

    const fallbackStock =
      typeof effectiveProduct.stock === "number" && effectiveProduct.stock > 0
        ? effectiveProduct.stock
        : typeof (effectiveProduct as any).stock_quantity === "number" && (effectiveProduct as any).stock_quantity > 0
        ? (effectiveProduct as any).stock_quantity
        : 100;

    const selVariant = (effectiveProduct as any).selected_variant;
    if (selVariant) return normalizeVariant(selVariant, effectiveProduct.image_url, fallbackStock);

    const defVariant = (effectiveProduct as any).default_variant;
    if (defVariant) return normalizeVariant(defVariant, effectiveProduct.image_url, fallbackStock);

    const rawStock = effectiveProduct.stock ?? (effectiveProduct as any).stock_quantity;
    const stock = typeof rawStock === "number" && !isNaN(rawStock) && rawStock > 0 ? rawStock : fallbackStock;
    const isOutOfStock =
      effectiveProduct.isAvailable === false ||
      (effectiveProduct as any).is_in_stock === false ||
      (effectiveProduct as any).is_available === false ||
      (typeof rawStock === "number" && rawStock <= 0);

    return {
      id: effectiveProduct.id,
      raw: null,
      name: effectiveProduct.unit || "1 pack",
      price: effectiveProduct.price,
      mrp: effectiveProduct.mrp ?? effectiveProduct.price,
      stock,
      inStock: !isOutOfStock,
      image: effectiveProduct.image_url,
      attributes: Array.isArray((effectiveProduct as any).attributes) ? (effectiveProduct as any).attributes : [],
    };
  }, [variants, selectedVariantId, effectiveProduct]);

  const { price, mrp, stock, inStock, name: unit, sku, attributes } = active;
  const discountPercentage = calcDiscount(price, mrp);

  // ---------- image gallery ----------
  const galleryImages = useMemo<string[]>(() => {
    const list: string[] = [];
    if (active.image) list.push(active.image);
    if (Array.isArray(effectiveProduct.images)) {
      for (const img of effectiveProduct.images) {
        const url = typeof img === "string" ? img : img?.image_url;
        if (url && !list.includes(url)) list.push(url);
      }
    }
    if (effectiveProduct.image_url && !list.includes(effectiveProduct.image_url)) {
      list.push(effectiveProduct.image_url);
    }
    return list.filter((url) => !!url && typeof url === "string" && url.trim() !== "");
  }, [effectiveProduct.images, effectiveProduct.image_url, active.image]);

  const [selectedImage, setSelectedImage] = useState<string>(active.image || effectiveProduct.image_url || "");

  // Update selected image whenever the active variant changes
  useEffect(() => {
    if (active.image) {
      setSelectedImage(active.image);
    } else if (galleryImages.length > 0 && !galleryImages.includes(selectedImage)) {
      setSelectedImage(galleryImages[0]);
    }
  }, [active.id, active.image, galleryImages]);

  const displayImage = selectedImage || active.image || effectiveProduct.image_url;

  // ---------- cart ----------
  const cartItem = items.find((item: any) =>
    active.raw
      ? (item.variantId ?? item.id) === active.id
      : item.productId === effectiveProduct.id || item.id === effectiveProduct.id
  );
  const cartQuantity = mounted && cartItem ? cartItem.quantity : 0;

  // variantId -> qty in cart (shows "X in cart" on each option card)
  const variantCartQuantities = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items as any[]) {
      const key = it.variantId ?? it.id;
      if (key) map.set(key, (map.get(key) || 0) + it.quantity);
    }
    return map;
  }, [items]);

  const productCartItems = useMemo(
    () => (items as any[]).filter((it) => it.productId === effectiveProduct.id),
    [items, effectiveProduct.id]
  );

  // ---------- handlers ----------
  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId);
    const targetVariant = variants.find((v) => v.id === variantId);
    if (targetVariant?.image) {
      setSelectedImage(targetVariant.image);
    }
    // Update the URL without a server refetch (Next 14.1+ keeps useSearchParams in sync)
    const params = new URLSearchParams(searchParams.toString());
    params.set("variantId", variantId);
    params.delete("variant");
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
  };

  const handleAddToCart = () => {
    if (!inStock) {
      toast.error("This option is currently out of stock");
      return;
    }
    const variantPayload = active.raw
      ? active.raw
      : {
          id: active.id,
          sku: active.sku,
          variant_name: active.name,
          unit: active.name,
          price: active.price,
          selling_price: active.price,
          mrp: active.mrp,
          stock: active.stock,
          stock_quantity: active.stock,
          isAvailable: active.inStock,
          is_in_stock: active.inStock,
          image_url: active.image,
          attributes: active.attributes,
        };

    addToCart({ product: effectiveProduct, variant: variantPayload }, 1);
    toast.success(`Added ${effectiveProduct.name} (${unit}) to basket`);
  };

  const handleIncrement = () => {
    if (!inStock) {
      toast.error("This option is currently out of stock");
      return;
    }
    if (cartItem) {
      if (stock > 0 && cartItem.quantity >= stock) {
        toast.error(`Only ${stock} units available`);
        return;
      }
      updateQuantity(cartItem.cartItemId || cartItem.variantId || cartItem.id, cartItem.quantity + 1);
    } else {
      handleAddToCart();
    }
  };

  const handleDecrement = () => {
    if (cartItem) {
      updateQuantity(
        cartItem.cartItemId || cartItem.variantId || cartItem.id,
        Math.max(0, cartItem.quantity - 1)
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
        <Link
          href={`/category/${product.category_slug}`}
          className="inline-flex items-center gap-1.5 font-bold text-[var(--text-secondary)] hover:text-[#18A818] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {product.category_name}</span>
        </Link>
        <span>/</span>
        <span className="truncate text-[var(--text-primary)]">{product.name}</span>
        {unit && (
          <>
            <span>/</span>
            <span className="text-[#18A818] font-bold">{unit}</span>
          </>
        )}
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* LEFT: Gallery */}
        <div className="md:sticky md:top-24 self-start">
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[var(--surface-secondary)] to-[var(--surface)] border border-[var(--border)] shadow-sm">
            {discountPercentage > 0 && (
              <span className="absolute left-4 top-4 z-10 flex items-center gap-1 rounded-xl bg-[#18A818] px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-md">
                <BadgePercent className="h-3.5 w-3.5" />
                {discountPercentage}% OFF
              </span>
            )}
            <span className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-xl bg-black/70 backdrop-blur-md px-3 py-1 text-xs font-bold text-white">
              <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              EXPRESS DELIVERY
            </span>

            <SafeImage
              key={displayImage}
              src={displayImage}
              alt={`${product.name} - ${unit}`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className={`object-contain p-8 transition-transform duration-500 hover:scale-105 ${!inStock ? "grayscale opacity-60" : ""
                }`}
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

            {!inStock && (
              <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center">
                <span className="rounded-xl bg-neutral-900/90 text-white font-extrabold text-sm px-4 py-2 tracking-wider uppercase shadow-xl">
                  Currently Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail switcher gallery */}
          {galleryImages.length > 1 && (
            <div className="mt-3.5 flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {galleryImages.map((imgUrl, idx) => {
                const isSelected = displayImage === imgUrl;
                return (
                  <button
                    key={imgUrl + idx}
                    type="button"
                    onClick={() => setSelectedImage(imgUrl)}
                    aria-label={`View image ${idx + 1}`}
                    className={`relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-2xl overflow-hidden border-2 bg-[var(--surface)] transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#18A818] ring-2 ring-[#18A818]/25 shadow-sm scale-105"
                        : "border-[var(--border)] hover:border-slate-400 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <SafeImage
                      src={imgUrl}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-contain p-1.5"
                    />
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-[11px] font-semibold text-[var(--text-secondary)]">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <ShieldCheck className="mx-auto mb-1 h-5 w-5 text-[#18A818]" />
              100% Genuine
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <Leaf className="mx-auto mb-1 h-5 w-5 text-[#18A818]" />
              Fresh Quality
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <Truck className="mx-auto mb-1 h-5 w-5 text-[#18A818]" />
              Fast Delivery
            </div>
          </div>
        </div>

        {/* RIGHT: Buy box */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[var(--surface-secondary)] px-2.5 py-0.5 text-xs font-bold text-[var(--text-secondary)] border border-[var(--border)]">
              {effectiveProduct.brand || effectiveProduct.category_name}
            </span>
            {effectiveProduct.badge && (
              <span className="rounded-full bg-[#18A818]/15 px-2.5 py-0.5 text-xs font-bold text-[#18A818]">
                {effectiveProduct.badge}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--text-primary)] tracking-tight leading-tight">
              {effectiveProduct.name}
            </h1>
            <p className="text-sm font-semibold text-[var(--text-muted)]">
              Pack Size: <span className="text-[var(--text-primary)] font-bold">{unit}</span>
              {sku && (
                <span className="ml-3 text-[11px] font-mono text-[var(--text-muted)]">SKU: {sku}</span>
              )}
            </p>
          </div>

          {(effectiveProduct.rating || 0) > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 rounded-lg bg-amber-500/15 px-2 py-1 font-bold text-amber-700 dark:text-amber-400">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>{effectiveProduct.rating}</span>
              </div>
              <span className="text-[var(--text-muted)]">
                ({effectiveProduct.ratingCount || 120} verified ratings)
              </span>
            </div>
          )}

          {/* Price (selected variant) */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-1">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-[var(--text-primary)]">
                {formatCurrency(price)}
              </span>
              {mrp > price && (
                <span className="text-base text-[var(--text-muted)] line-through">
                  MRP {formatCurrency(mrp)}
                </span>
              )}
              {discountPercentage > 0 && (
                <span className="text-xs font-black text-[#18A818] bg-[#18A818]/10 px-2.5 py-1 rounded-full">
                  Save {formatCurrency(mrp - price)} ({discountPercentage}% OFF)
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">(Inclusive of all taxes)</p>
          </div>

          {/* Variant picker */}
          {variants.length > 1 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Select Pack Size
                </span>
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  {variants.length} options available
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5" role="radiogroup">
                {variants.map((v) => {
                  const isSelected = v.id === active.id;
                  const off = calcDiscount(v.price, v.mrp);
                  const inCartCount = mounted ? variantCartQuantities.get(v.id) || 0 : 0;

                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleVariantChange(v.id)}
                      className={`relative rounded-2xl border-2 p-3 text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${isSelected
                          ? "border-[#18A818] bg-[#18A818]/10 shadow-xs ring-2 ring-[#18A818]/25"
                          : !v.inStock
                            ? "border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/50 opacity-70"
                            : "border-[var(--border)] bg-[var(--surface)] hover:border-[#18A818]/60 hover:-translate-y-0.5"
                        }`}
                    >
                      {isSelected && (
                        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#18A818] text-white shadow-xs">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}

                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] leading-tight">
                          {v.name}
                        </p>
                        {off > 0 && v.inStock && (
                          <span className="shrink-0 rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] font-black uppercase text-white shadow-xs">
                            {off}% off
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-black text-[var(--text-primary)]">
                          {formatCurrency(v.price)}
                        </span>
                        {v.mrp > v.price && (
                          <span className="text-[10px] text-[var(--text-muted)] line-through">
                            {formatCurrency(v.mrp)}
                          </span>
                        )}
                      </div>

                      <div className="pt-0.5">
                        {!v.inStock ? (
                          <p className="text-[10px] font-bold text-rose-500">Out of stock</p>
                        ) : inCartCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#18A818] px-1.5 py-0.5 text-[10px] font-black text-white shadow-xs">
                            <ShoppingCart className="h-2.5 w-2.5" />
                            {inCartCount} in cart
                          </span>
                        ) : v.stock > 0 && v.stock <= 5 ? (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            ⚡ {v.stock} left
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--text-muted)]">Available</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock badge (selected variant) */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            {!inStock ? (
              <span className="rounded-full bg-red-500/10 px-3 py-1 text-red-600 font-bold">
                Currently Out of stock
              </span>
            ) : stock > 0 && stock <= 10 ? (
              <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-700 dark:text-amber-400 font-bold">
                ⚡ Only {stock} units left in stock!
              </span>
            ) : (
              <span className="rounded-full bg-[#18A818]/10 px-3 py-1 text-[#18A818] font-bold">
                In Stock • Dark Store Ready
              </span>
            )}
          </div>

          {/* Add to cart / stepper */}
          <div className="space-y-2 pt-1">
            {!inStock ? (
              <Button
                disabled
                size="sm"
                className="h-9 px-5 rounded-xl bg-slate-200 dark:bg-neutral-800 text-slate-400 font-bold text-xs cursor-not-allowed w-auto inline-flex"
              >
                OUT OF STOCK
              </Button>
            ) : cartQuantity > 0 ? (
              <div className="space-y-1.5">
                <div className="inline-flex items-center justify-between gap-3 rounded-xl bg-[#18A818] text-white px-2.5 py-1 shadow-xs">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    aria-label="Decrease quantity"
                    className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-black/15 transition-colors cursor-pointer"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <div className="text-center px-1 select-none">
                    <span className="text-xs font-black leading-none block">{cartQuantity} in Basket</span>
                    <span className="text-[10px] text-white/90 font-medium leading-none block mt-0.5">
                      ({unit} • {formatCurrency(price * cartQuantity)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    aria-label="Increase quantity"
                    className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-black/15 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                {variants.length > 1 && (
                  <p className="text-[11px] text-[var(--text-muted)]">
                    💡 Select another pack size above to add it separately to your basket.
                  </p>
                )}
              </div>
            ) : (
              <Button
                onClick={handleAddToCart}
                className="h-10 px-5 rounded-xl bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-xs tracking-wide shadow-xs active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer w-auto"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>ADD TO BASKET • {formatCurrency(price)}</span>
              </Button>
            )}

            {productCartItems.length > 1 && (
              <div className="rounded-xl border border-[#18A818]/25 bg-[#18A818]/10 p-2.5 text-xs text-[#18A818] font-bold flex items-center justify-between max-w-sm">
                <span>🛒 {productCartItems.length} different pack sizes in basket</span>
                <span className="font-extrabold text-[var(--text-primary)]">
                  Total: {productCartItems.reduce((acc, it) => acc + it.quantity, 0)} units
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[var(--border-light)] text-xs">
            <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] p-3">
              <Truck className="h-5 w-5 text-[#18A818] shrink-0" />
              <div>
                <p className="font-bold text-[var(--text-primary)]">Express Delivery</p>
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

      {/* About + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-3">
          <h2 className="text-base font-bold text-[var(--text-primary)]">About the Product</h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
            {effectiveProduct.description ||
              "Fresh and verified quality grocery item directly sourced and stored under temperature-controlled hygiene standards."}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-3">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Product Details</h2>
          <dl className="divide-y divide-[var(--border-light)] text-xs">
            <div className="flex justify-between py-2">
              <dt className="text-[var(--text-muted)]">Brand</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{effectiveProduct.brand}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-[var(--text-muted)]">Category</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{effectiveProduct.category_name}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-[var(--text-muted)]">Pack Size</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{unit}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-[var(--text-muted)]">Selling Price</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{formatCurrency(price)}</dd>
            </div>
            {mrp > price && (
              <div className="flex justify-between py-2">
                <dt className="text-[var(--text-muted)]">MRP</dt>
                <dd className="font-semibold text-[var(--text-muted)] line-through">{formatCurrency(mrp)}</dd>
              </div>
            )}
            <div className="flex justify-between py-2">
              <dt className="text-[var(--text-muted)]">Availability</dt>
              <dd className={`font-semibold ${inStock ? "text-[#18A818]" : "text-rose-500"}`}>
                {inStock ? (stock > 0 && stock <= 10 ? `Only ${stock} left` : "In Stock") : "Out of Stock"}
              </dd>
            </div>
            {sku && (
              <div className="flex justify-between py-2">
                <dt className="text-[var(--text-muted)]">SKU</dt>
                <dd className="font-semibold font-mono text-[var(--text-primary)]">{sku}</dd>
              </div>
            )}
            {attributes.map((attr) => (
              <div key={attr.attribute_name} className="flex justify-between py-2">
                <dt className="text-[var(--text-muted)]">{attr.attribute_name}</dt>
                <dd className="font-semibold text-[var(--text-primary)]">{attr.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Related */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Similar Products in this Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}