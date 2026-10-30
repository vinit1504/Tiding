"use client";

import React, { useMemo, useState, useTransition, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Product } from "@/types/product";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";

import {
  CartControl,
  ProductGallery,
  ProductHeader,
  ProductVariantSelector,
  ProductPriceSection,
  ProductDetailsAccordion,
  ProductWhyShop,
  ProductMobileBar,
  ProductRelatedShelf,
} from "./detail";

export interface ProductDetailViewProps {
  product: Product;
  initialVariantId?: string;
  relatedProducts?: Product[];
}

export function ProductDetailView({
  product,
  initialVariantId,
  relatedProducts = [],
}: ProductDetailViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  // Cart & Wishlist hooks
  const { items: cartItems = [], addToCart, updateQuantity, removeItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const p: any = product;
  const variants: any[] = p.variants ?? [];

  // Active Variant State
  const [variantId, setVariantId] = useState<string | undefined>(
    initialVariantId ?? p.selected_variant?.id ?? variants[0]?.id
  );

  const active: any =
    variants.find((v) => v.id === variantId) ?? p.selected_variant ?? variants[0] ?? null;

  // Selected Variant / Product Pricing & Stock
  const price = Number(active?.selling_price ?? active?.price ?? product.price ?? 0);
  const mrp = Number(active?.mrp ?? product.mrp ?? price);
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const available = active
    ? active.isAvailable !== false && active.is_in_stock !== false
    : product.isAvailable !== false && product.is_in_stock !== false;
  const stock = Number(active?.stock_quantity ?? active?.stock ?? product.stock ?? 50);
  const maxQty = Math.max(1, Math.min(stock || 10, 10));
  const unitLabel = active?.unit || product.unit || "1 pack";
  const isVeg = p.is_veg ?? true;
  const eta = product.deliveryEtaMinutes || 8;

  // Wishlist Status
  const wished = mounted ? isWishlisted(product.id, active?.id) : false;

  // ---------------- Cart Item Resolution & Actions ----------------
  // Find current active item in cart
  const currentCartItem = useMemo(() => {
    if (!mounted) return undefined;
    return cartItems.find((item: any) => {
      if (active?.id) {
        return (
          item.variantId === active.id ||
          item.id === active.id ||
          (item.productId === product.id && item.variantId === active.id)
        );
      }
      return item.productId === product.id || item.id === product.id;
    });
  }, [cartItems, active?.id, product.id, mounted]);

  const cartQty = currentCartItem?.quantity ?? 0;

  // Canonical cart identifier for update / remove operations
  const cartItemIdentifier = useMemo(() => {
    return (
      currentCartItem?.cartItemId ||
      currentCartItem?.variantId ||
      currentCartItem?.id ||
      active?.id ||
      product.id
    );
  }, [currentCartItem, active?.id, product.id]);

  const handleAdd = () => {
    if (!available) return;
    addToCart(active ? { product, variant: active } : product, 1);
    toast.success(`${product.name} (${unitLabel}) added to cart`);
  };

  const handleIncrease = () => {
    if (cartQty >= maxQty) {
      toast.info(`Maximum ${maxQty} per order`);
      return;
    }
    const nextQty = cartQty + 1;
    if (currentCartItem) {
      updateQuantity(cartItemIdentifier, nextQty);
    } else {
      addToCart(active ? { product, variant: active } : product, 1);
    }
  };

  const handleDecrease = () => {
    const nextQty = cartQty - 1;
    if (nextQty <= 0) {
      removeItem(cartItemIdentifier);
    } else {
      updateQuantity(cartItemIdentifier, nextQty);
    }
  };

  // Helper to fetch quantity of any specific variant (for unit badges)
  const getVariantQty = useCallback(
    (vId: string): number => {
      if (!mounted) return 0;
      const match = cartItems.find(
        (item: any) =>
          item.variantId === vId ||
          item.id === vId ||
          (item.productId === product.id && item.variantId === vId)
      );
      return match?.quantity ?? 0;
    },
    [cartItems, product.id, mounted]
  );

  // ---------------- Gallery Images: strictly active variant wise ----------------
  const images: string[] = useMemo(() => {
    // 1. Get ONLY the active variant's images
    const rawOwn = active?.images?.length
      ? active.images
      : active?.image_url
      ? [active.image_url]
      : [];
    const own: string[] = (Array.isArray(rawOwn) ? rawOwn : [rawOwn])
      .map((img: any) => (typeof img === "string" ? img : img?.image_url || ""))
      .filter(Boolean);

    // If this variant has its own image(s), display ONLY this variant's images
    if (own.length > 0) {
      return Array.from(new Set(own));
    }

    // 2. Only if the variant has NO images at all, fall back to product base images
    const productBase = (product.images ?? [])
      .map((img: any) => (typeof img === "string" ? img : img?.image_url || ""))
      .filter(Boolean);

    if (productBase.length > 0) {
      return Array.from(new Set(productBase));
    }

    return product.image_url ? [product.image_url] : [];
  }, [product.images, product.image_url, active?.images, active?.image_url]);

  // Variant Switcher: updates state immediately & updates browser URL synchronously without triggering RSC flight
  const selectVariant = (id: string) => {
    setVariantId(id);
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("variantId", id);
        window.history.replaceState(window.history.state, "", url.toString());
      } catch (err) {
        console.warn("Failed to update URL search params:", err);
      }
    }
  };

  // Wishlist & Share Handlers
  const handleWishlistToggle = async () => {
    try {
      await toggleWishlist({ id: product.id, variantId: active?.id, name: product.name });
    } catch {}
  };

  const handleShare = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: product.name, url: window.location.href });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Product link copied to clipboard!");
      }
    } catch {}
  };

  // Shared Cart Control element
  const cartControlNode = (
    <CartControl
      available={available}
      cartQty={cartQty}
      maxQty={maxQty}
      onAdd={handleAdd}
      onInc={handleIncrease}
      onDec={handleDecrease}
    />
  );

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-12 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2">
          {/* ================= LEFT COLUMN: GALLERY & SPECS ================= */}
          <section className="px-4 py-6 sm:px-8 lg:border-r lg:border-slate-200 lg:px-10">
            <div className="lg:sticky lg:top-20">
              <ProductGallery
                key={active?.id || "gallery"}
                images={images}
                productName={product.name}
                discount={discount}
                available={available}
              />

              <ProductDetailsAccordion
                product={product}
                activeVariant={active}
                unitLabel={unitLabel}
              />
            </div>
          </section>

          {/* ================= RIGHT COLUMN: PRODUCT DETAILS & BUY ================= */}
          <section className="px-4 py-6 sm:px-8 lg:px-10">
            <ProductHeader
              name={product.name}
              categoryName={product.category_name}
              categorySlug={product.category_slug}
              brand={product.brand}
              isVeg={isVeg}
              deliveryEtaMinutes={eta}
              isWishlisted={wished}
              onToggleWishlist={handleWishlistToggle}
              onShare={handleShare}
            />

            <ProductVariantSelector
              variants={variants}
              activeVariantId={active?.id}
              onSelectVariant={selectVariant}
              getVariantQty={getVariantQty}
            />

            <ProductPriceSection
              unitLabel={unitLabel}
              price={price}
              mrp={mrp}
              discount={discount}
              cartControl={cartControlNode}
              cartQty={cartQty}
            />

            <ProductWhyShop deliveryEtaMinutes={eta} />
          </section>
        </div>

        {/* ================= RELATED PRODUCTS SHELF ================= */}
        <ProductRelatedShelf
          products={relatedProducts}
          categorySlug={product.category_slug}
        />
      </div>

      {/* ================= MOBILE BOTTOM STICKY BAR ================= */}
      <ProductMobileBar
        unitLabel={unitLabel}
        price={price}
        cartControl={cartControlNode}
      />
    </div>
  );
}

export default ProductDetailView;