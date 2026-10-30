"use client";

import React, { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Heart,
  ShoppingCart,
  Share2,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicWishlistQuery } from "@/queries/wishlist/use-wishlist-queries";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { formatCurrency } from "@/lib/utils";
import { SITE_CONFIG } from "@/lib/constants/site-config";
import { toast } from "sonner";

export default function SharedWishlistPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const unwrappedParams = use(params);
  const token = unwrappedParams.token;

  const { data, isLoading, error } = usePublicWishlistQuery(token);
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const wishlist = data?.wishlist;
  const items = data?.items || wishlist?.items || [];
  const sharedBy = data?.sharedBy || "A Tiding Customer";

  const handleAddToCart = async (item: any) => {
    try {
      await addToCart({
        id: item.productId,
        name: item.productName || item.product?.name || "Product",
        slug: item.productSlug || item.product?.slug || `product-${item.productId}`,
        price: Number(item.currentPrice || item.product?.price || 0),
        mrp: Number(item.originalPrice || item.product?.mrp || item.currentPrice || 0),
        unit: item.variantName || item.unit || "1 unit",
        stock: item.availableStock || 10,
        images: [
          item.thumbnailUrl ||
          item.product?.thumbnailUrl ||
          item.product?.images?.[0] ||
          "",
        ],
        selected_variant: item.variantId
          ? { id: item.variantId, variant_name: item.variantName }
          : undefined,
      } as any);
      toast.success("Added to your cart!");
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-8 space-y-3">
        <Loader2 className="h-8 w-8 text-[#0c831f] animate-spin" />
        <p className="text-xs text-gray-500 font-medium">Loading shared wishlist...</p>
      </div>
    );
  }

  if (error || !wishlist) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-8 space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100">
          <Heart className="h-8 w-8 stroke-[1.5]" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-black text-gray-900">Wishlist Not Found</h2>
          <p className="text-xs text-gray-500 max-w-sm">
            This wishlist may have been removed, set to private, or the share link has expired.
          </p>
        </div>
        <Link href="/">
          <Button className="h-10 px-5 bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer">
            Return to Store
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 shadow-xs">
            <Share2 className="h-7 w-7" />
          </div>

          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-extrabold border border-emerald-100 uppercase tracking-wider">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              Shared Wishlist
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {wishlist.name || "Curated Wishlist"}
            </h1>
            {wishlist.description && (
              <p className="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto">
                {wishlist.description}
              </p>
            )}
            <p className="text-xs text-gray-400 font-medium pt-1">
              {items.length} {items.length === 1 ? "item" : "items"} curated on {SITE_CONFIG.name}
            </p>
          </div>
        </div>

        {/* Items List */}
        <div className="mt-6 space-y-3">
          {items.map((item: any) => {
            const currentPrice = Number(
              item.currentPrice ?? item.variant?.price ?? item.product?.price ?? item.addedPrice ?? 0
            );
            const mrp = Number(
              item.originalPrice ?? item.variant?.mrp ?? item.product?.mrp ?? Math.round(currentPrice * 1.2)
            );
            const thumbnail =
              item.thumbnailUrl ||
              item.product?.thumbnailUrl ||
              item.product?.images?.[0] ||
              "https://res.cloudinary.com/dktxfhq00/image/upload/v1790058895/tiding/avatars/xub5yhdvvd46adh8uoiv.png";
            const productName = item.productName || item.product?.name || "Product";
            const productSlug = item.productSlug || item.product?.slug || `product-${item.productId}`;
            const inStock = item.inStock ?? true;
            const wished = isWishlisted(item.productId, item.variantId);

            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-xs hover:shadow-md hover:border-gray-200 transition-all"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <Link
                    href={`/product/${productSlug}`}
                    className="relative h-20 w-20 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 border border-gray-100"
                  >
                    <Image
                      src={thumbnail}
                      alt={productName}
                      fill
                      sizes="80px"
                      className="object-contain p-2 hover:scale-105 transition-transform"
                    />
                  </Link>

                  <div className="space-y-1 min-w-0">
                    <Link
                      href={`/product/${productSlug}`}
                      className="block font-bold text-sm text-gray-900 hover:text-[#0c831f] transition-colors truncate"
                    >
                      {productName}
                    </Link>
                    <p className="text-xs text-gray-500 font-medium">
                      {item.variantName || item.unit || "1 unit"}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black text-gray-900">
                        {formatCurrency(currentPrice)}
                      </span>
                      {mrp > currentPrice && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatCurrency(mrp)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                  {/* Save to own wishlist */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toggleWishlist({
                        id: item.productId,
                        variantId: item.variantId,
                        name: productName,
                      })
                    }
                    className="h-10 px-3 border-gray-200 rounded-xl cursor-pointer"
                    title={wished ? "Saved to your wishlist" : "Save to your wishlist"}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        wished ? "fill-rose-500 text-rose-500" : "text-gray-500"
                      }`}
                    />
                  </Button>

                  {/* Add to Cart */}
                  <Button
                    onClick={() => handleAddToCart(item)}
                    disabled={!inStock}
                    className="flex-1 sm:w-36 h-10 bg-[#0c831f] hover:bg-[#0a6f1a] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Add to Cart</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="mt-8 text-center bg-emerald-50/70 border border-emerald-100 rounded-2xl p-6 space-y-3">
          <h3 className="text-base font-black text-gray-900">
            Enjoy Express Delivery with {SITE_CONFIG.name}
          </h3>
          <p className="text-xs text-gray-600 max-w-md mx-auto">
            Order fresh groceries, dairy, snacks, and daily staples delivered directly to your doorstep.
          </p>
          <Link href="/">
            <Button className="h-10 px-5 bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5">
              <span>Start Shopping</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
