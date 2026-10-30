"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAtom, useAtomValue } from "jotai";
import {
  Heart,
  ShoppingCart,
  Share2,
  Trash2,
  Plus,
  Star,
  TrendingDown,
  PackageCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountLayout } from "@/components/account/account-layout";
import { ProductCard, ProductCardSkeleton } from "@/components/product/product-card";
import { WishlistItemCard } from "@/components/wishlist/wishlist-item-card";
import { WishlistShareModal } from "@/components/wishlist/wishlist-share-modal";
import { CreateWishlistModal } from "@/components/wishlist/create-wishlist-modal";
import { EditItemModal } from "@/components/wishlist/edit-item-modal";
import {
  userProfileAtom,
  authSessionAtom,
  deliveryLocationAtom,
  isAuthDrawerOpenAtom,
  customerWishlistItemsAtom,
} from "@/stores";
import {
  useCustomerWishlistQuery,
  useWishlistIdsQuery,
  useMyWishlistsQuery,
  useMoveWishlistItemToCartMutation,
  useMoveAllWishlistToCartMutation,
  useRemoveFromWishlistMutation,
  useClearWishlistMutation,
  useShareWishlistMutation,
  useSetDefaultWishlistMutation,
} from "@/queries/wishlist/use-wishlist-queries";
import { Wishlist, WishlistItem } from "@/types/wishlist";
import { Product } from "@/types/product";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Adapt a WishlistItem into a standard Product model for ProductCard
 */
function wishlistItemToProduct(item: WishlistItem): Product {
  const prod = (item.product as Record<string, any>) || {};
  const variant = (item.variant as Record<string, any>) || {};

  const id = item.productId || item.product_id || prod.id || item.id;
  const variantId = item.variantId || item.variant_id || variant.id;

  const name =
    item.productName || item.product_name || item.name || prod.name || "Product";
  const slug =
    item.productSlug || item.product_slug || item.slug || prod.slug || id;

  const currentPrice = Number(
    item.sellingPrice ??
      item.selling_price ??
      item.currentPrice ??
      item.price ??
      variant.price ??
      prod.price ??
      item.addedPrice ??
      0
  );

  const rawMrp = Number(
    item.mrp ??
      item.originalPrice ??
      variant.mrp ??
      prod.mrp ??
      (currentPrice > 0 ? Math.round(currentPrice * 1.25) : 0)
  );
  const mrp = Math.max(rawMrp, currentPrice);

  const discountPercentage =
    mrp > currentPrice && mrp > 0
      ? Math.round(((mrp - currentPrice) / mrp) * 100)
      : Number(prod.discountPercentage ?? (item as any).discountPercentage ?? 0);

  const imageUrl =
    item.image ||
    item.imageUrl ||
    item.image_url ||
    item.thumbnail_url ||
    item.thumbnailUrl ||
    prod.thumbnailUrl ||
    prod.thumbnail_url ||
    prod.image_url ||
    (Array.isArray(prod.images) && prod.images.length > 0
      ? typeof prod.images[0] === "string"
        ? prod.images[0]
        : prod.images[0]?.image_url
      : null) ||
    "https://res.cloudinary.com/dktxfhq00/image/upload/v1792652242/tiding/products/qmtjpdqychk9dfl37eun.avif";

  const unit =
    item.variantName ||
    item.variant_name ||
    variant.name ||
    variant.unit ||
    item.unit ||
    prod.unit ||
    "1 pack";

  const inStock =
    typeof item.inStock === "boolean"
      ? item.inStock
      : typeof item.is_in_stock === "boolean"
      ? item.is_in_stock
      : item.availableStock !== undefined
      ? item.availableStock > 0
      : prod.isAvailable ?? prod.is_in_stock ?? true;

  const stock =
    item.availableStock ?? variant.stock ?? prod.stock ?? (inStock ? 50 : 0);

  const variantObj = variantId
    ? {
        id: variantId,
        name: unit,
        variant_name: unit,
        unit,
        price: currentPrice,
        selling_price: currentPrice,
        mrp,
        stock,
        stock_quantity: stock,
        isAvailable: inStock,
        is_in_stock: inStock,
        image_url: imageUrl,
      }
    : undefined;

  return {
    ...prod,
    id,
    name,
    slug,
    description: prod.description || "",
    brand: prod.brand || (item as any).brand || "",
    image_url: imageUrl,
    images: Array.isArray(prod.images) && prod.images.length > 0 ? prod.images : [imageUrl],
    category_id: prod.category_id || "",
    category_name: prod.category_name || "",
    category_slug: prod.category_slug || "",
    price: currentPrice,
    mrp,
    discountPercentage,
    unit,
    stock,
    stock_quantity: stock,
    isAvailable: inStock,
    is_in_stock: inStock,
    deliveryEtaMinutes: prod.deliveryEtaMinutes || (item as any).deliveryEtaMinutes || 8,
    rating: Number(prod.rating ?? (item as any).rating ?? 4.8),
    ratingCount: Number(prod.ratingCount ?? prod.reviews_count ?? (item as any).ratingCount ?? 120),
    variants: variantObj ? [variantObj] : prod.variants,
    default_variant: variantObj || prod.default_variant,
    selected_variant: variantObj || prod.selected_variant,
  };
}

export default function WishlistPage() {
  const [user] = useAtom(userProfileAtom);
  const [session] = useAtom(authSessionAtom);
  const location = useAtomValue(deliveryLocationAtom);
  const [, setIsAuthDrawerOpen] = useAtom(isAuthDrawerOpenAtom);

  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedWishlistId, setSelectedWishlistId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeShareToken, setActiveShareToken] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const areaId = location?.areaId;

  // Lightweight sync for heart icons and fast item loading
  useWishlistIdsQuery();
  const [customerItems] = useAtom(customerWishlistItemsAtom);

  // 1. Fetch all customer wishlists
  const { data: myWishlists = [], refetch: refetchWishlists } = useMyWishlistsQuery();

  // Pick default or first wishlist
  const activeWishlist = useMemo(() => {
    if (!myWishlists.length) return null;
    if (selectedWishlistId) {
      return myWishlists.find((w) => w.id === selectedWishlistId) || myWishlists[0];
    }
    const defaultList = myWishlists.find((w) => w.isDefault);
    return defaultList || myWishlists[0];
  }, [myWishlists, selectedWishlistId]);

  // 2. Fetch active customer wishlist with location-aware inventory & price drop calculations
  const {
    data: wishlistData,
    isLoading: isWishlistLoading,
    refetch: refetchItems,
  } = useCustomerWishlistQuery({
    areaId,
    page: 1,
    limit: 50,
  });

  const items = useMemo(() => {
    if (selectedWishlistId && activeWishlist?.items && activeWishlist.items.length > 0) {
      return activeWishlist.items;
    }
    if (wishlistData?.items && wishlistData.items.length > 0) {
      return wishlistData.items;
    }
    if (customerItems && customerItems.length > 0) {
      return customerItems;
    }
    return activeWishlist?.items || [];
  }, [selectedWishlistId, activeWishlist, wishlistData, customerItems]);

  // Mutations
  const moveItemToCartMutation = useMoveWishlistItemToCartMutation();
  const moveAllToCartMutation = useMoveAllWishlistToCartMutation();
  const removeItemMutation = useRemoveFromWishlistMutation();
  const clearWishlistMutation = useClearWishlistMutation();
  const shareWishlistMutation = useShareWishlistMutation();
  const setDefaultWishlistMutation = useSetDefaultWishlistMutation();

  // Metrics
  const totalItems = items.length;
  const inStockCount = items.filter(
    (i) => i.inStock ?? (i.availableStock !== undefined ? i.availableStock > 0 : true)
  ).length;
  const priceDropCount = items.filter(
    (i) => i.hasPriceDropped || (i.addedPrice && i.currentPrice && i.addedPrice > i.currentPrice)
  ).length;

  const totalSavings = useMemo(() => {
    return items.reduce((acc, curr) => {
      const added = Number(curr.addedPrice || 0);
      const current = Number(curr.currentPrice || 0);
      if (added > current) {
        return acc + (added - current);
      }
      return acc;
    }, 0);
  }, [items]);

  const handleShare = async () => {
    const targetId = activeWishlist?.id || "default";
    try {
      const res = await shareWishlistMutation.mutateAsync(targetId);
      if (res?.shareToken) {
        setActiveShareToken(res.shareToken);
      } else if (activeWishlist?.shareToken) {
        setActiveShareToken(activeWishlist.shareToken);
      }
      setIsShareModalOpen(true);
    } catch {
      // Handled
    }
  };

  const handleMoveAll = async () => {
    const targetId = activeWishlist?.id || "default";
    try {
      await moveAllToCartMutation.mutateAsync(targetId);
    } catch {
      // Handled
    }
  };

  const handleSetDefault = async () => {
    if (!activeWishlist?.id) return;
    try {
      await setDefaultWishlistMutation.mutateAsync(activeWishlist.id);
    } catch {
      // Handled
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to remove all items from your wishlist?")) return;
    try {
      await clearWishlistMutation.mutateAsync();
    } catch {
      // Handled
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-[#0c831f] animate-spin" />
      </div>
    );
  }

  return (
    <AccountLayout activeTab="wishlist" mainClassName="space-y-6">
      {/* Header & Title */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500 border border-rose-100">
                      <Heart className="h-5 w-5 fill-rose-500" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                        {activeWishlist?.name || "My Wishlist"}
                      </h1>
                      <p className="text-xs text-gray-500 font-medium">
                        Real-time location inventory and price drop alerts
                      </p>
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* View Mode Toggle */}
                  {items.length > 0 && (
                    <div className="flex items-center rounded-xl bg-gray-100 p-0.5 border border-gray-200/80 mr-1">
                      <button
                        type="button"
                        onClick={() => setViewMode("grid")}
                        className={`h-7 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          viewMode === "grid"
                            ? "bg-white text-gray-900 shadow-xs"
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                        title="Grid view"
                      >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Grid</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("list")}
                        className={`h-7 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          viewMode === "list"
                            ? "bg-white text-gray-900 shadow-xs"
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                        title="List view"
                      >
                        <ListIcon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">List</span>
                      </button>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    disabled={shareWishlistMutation.isPending}
                    className="h-9 px-3 text-xs font-bold border-gray-200 text-gray-700 hover:text-gray-900 rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Share List</span>
                  </Button>

                  {items.length > 0 && inStockCount > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleMoveAll}
                      disabled={moveAllToCartMutation.isPending}
                      className="h-9 px-4 text-xs font-bold bg-[#0c831f] hover:bg-[#0a6f1a] text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      {moveAllToCartMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ShoppingCart className="h-3.5 w-3.5" />
                      )}
                      <span>Move All to Cart</span>
                    </Button>
                  )}

                  {items.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearAll}
                      disabled={clearWishlistMutation.isPending}
                      className="h-9 px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border-gray-200 hover:border-rose-200 rounded-xl cursor-pointer"
                      title="Clear all wishlist items"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Multiple Wishlists Tab Selector */}
              {myWishlists.length > 1 && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100 overflow-x-auto pb-1 scrollbar-none">
                  {myWishlists.map((wl) => {
                    const isSelected = activeWishlist?.id === wl.id;
                    return (
                      <button
                        key={wl.id}
                        type="button"
                        onClick={() => setSelectedWishlistId(wl.id)}
                        className={`h-8 px-3.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-gray-900 text-white shadow-xs"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200/80"
                        }`}
                      >
                        {wl.isDefault && (
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        )}
                        <span>{wl.name}</span>
                        {wl.itemsCount !== undefined && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                              isSelected ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {wl.itemsCount}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-8 px-3 rounded-full text-xs font-bold border border-dashed border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>New List</span>
                  </button>
                </div>
              )}

              {/* Statistics & Insights Banner */}
              {items.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-500">Total Items</p>
                    <p className="text-lg font-black text-gray-900 mt-0.5">{totalItems}</p>
                  </div>
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100/80">
                    <p className="text-[11px] font-semibold text-emerald-800">In Stock Ready</p>
                    <p className="text-lg font-black text-emerald-700 mt-0.5">
                      {inStockCount} / {totalItems}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100/80">
                    <p className="text-[11px] font-semibold text-amber-800">Price Drops</p>
                    <p className="text-lg font-black text-amber-700 mt-0.5">{priceDropCount}</p>
                  </div>
                  <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100/80">
                    <p className="text-[11px] font-semibold text-purple-800">Total Price Savings</p>
                    <p className="text-lg font-black text-purple-700 mt-0.5">
                      {formatCurrency(totalSavings)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Wishlist Items List / Grid */}
            {isWishlistLoading ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-y-3.5 sm:gap-y-4 [&>*]:min-w-0">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : items.length === 0 ? (
              /* Empty State */
              <div className="bg-white rounded-2xl p-10 sm:p-14 border border-gray-100 shadow-xs text-center space-y-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-500 border border-rose-100">
                  <Heart className="h-10 w-10 stroke-[1.5]" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h3 className="text-lg font-black text-gray-900">Your Wishlist is Empty</h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Explore our freshest vegetables, fruits, dairy, and household essentials. Tap the
                    heart icon on any product to save it here for later.
                  </p>
                </div>
                <div className="pt-2">
                  <Link href="/">
                    <Button className="h-11 px-6 bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-2">
                      <span>Start Exploring</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : viewMode === "grid" ? (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-y-3.5 sm:gap-y-4 [&>*]:min-w-0">
                  {items.map((item) => {
                    const productObj = wishlistItemToProduct(item);
                    return (
                      <ProductCard
                        key={item.id || item.productId}
                        product={productObj}
                        isWishlisted={true}
                        onToggleWishlist={async (_prod, next) => {
                          if (!next) {
                            try {
                              await removeItemMutation.mutateAsync({
                                itemId: item.id,
                                productId: item.productId || (item as any).product_id,
                                variantId: item.variantId || (item as any).variant_id,
                              });
                              toast.success("Removed from wishlist");
                            } catch {
                              toast.error("Failed to remove item");
                            }
                          }
                        }}
                      />
                    );
                  })}
                </div>

                {/* End of list banner matching the category page design */}
                <div className="mt-10 flex flex-col items-center gap-1.5 text-center py-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#18A818]/10 text-[#18A818]">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <p className="text-xs font-bold text-slate-700">
                    You&apos;ve seen all {items.length} {items.length === 1 ? "item" : "items"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Explore more categories to discover fresh groceries and deals
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <WishlistItemCard
                    key={item.id}
                    item={item}
                    onMoveToCart={(itemId) =>
                      moveItemToCartMutation.mutateAsync({ itemId, areaId })
                    }
                    onRemove={(itemId, productId, variantId) =>
                      removeItemMutation.mutateAsync({ itemId, productId, variantId })
                    }
                    onEdit={(it) => setEditingItem(it)}
                    isMoving={moveItemToCartMutation.isPending}
                    isRemoving={removeItemMutation.isPending}
                  />
                ))}
              </div>
            )}

      {/* Share Modal */}
      <WishlistShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareToken={activeShareToken || activeWishlist?.shareToken}
        wishlistName={activeWishlist?.name}
      />

      {/* Create Custom Wishlist Modal */}
      <CreateWishlistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetchWishlists()}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        item={editingItem}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
      />
    </AccountLayout>
  );
}
