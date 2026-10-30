export type WishlistPriority = "LOW" | "MEDIUM" | "HIGH";

export interface WishlistItem {
  id: string; // wishlistItemId
  wishlistId?: string;
  productId: string;
  product_id?: string;
  variantId?: string;
  variant_id?: string;
  priority?: WishlistPriority;
  notifyOnPriceDrop?: boolean;
  notifyOnRestock?: boolean;
  notes?: string | null;
  addedPrice?: number;
  currentPrice?: number;
  originalPrice?: number;
  priceDrop?: number;
  hasPriceDropped?: boolean;
  inStock?: boolean;
  is_in_stock?: boolean;
  availableStock?: number;
  stockStatus?: "IN_STOCK" | "OUT_OF_STOCK" | "LOW_STOCK";
  name?: string;
  productName?: string;
  product_name?: string;
  slug?: string;
  productSlug?: string;
  product_slug?: string;
  variantName?: string;
  variant_name?: string;
  price?: number;
  mrp?: number;
  sellingPrice?: number;
  selling_price?: number;
  image?: string;
  imageUrl?: string;
  image_url?: string;
  thumbnail_url?: string;
  thumbnailUrl?: string | null;
  product_status?: string;
  sku?: string;
  unit?: string;
  createdAt?: string;
  updatedAt?: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    thumbnailUrl?: string;
    images?: string[];
    price?: number;
    mrp?: number;
    unit?: string;
    [key: string]: unknown;
  };
  variant?: {
    id: string;
    name: string;
    sku?: string;
    price?: number;
    mrp?: number;
    stock?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface Wishlist {
  id: string;
  customerId?: string;
  name: string;
  description?: string | null;
  isDefault?: boolean;
  isPublic?: boolean;
  shareToken?: string | null;
  shareUrl?: string | null;
  itemsCount?: number;
  totalItems?: number;
  inStockCount?: number;
  priceDropCount?: number;
  items?: WishlistItem[];
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistIdsResponse {
  productIds: string[];
  variantIds?: string[];
  itemIds?: string[];
  items?: WishlistItem[];
}

export interface AddWishlistItemPayload {
  productId: string;
  variantId?: string;
  priority?: WishlistPriority;
  notifyOnPriceDrop?: boolean;
  notifyOnRestock?: boolean;
  notes?: string;
}

export interface UpdateWishlistItemPayload {
  priority?: WishlistPriority;
  notifyOnPriceDrop?: boolean;
  notifyOnRestock?: boolean;
  notes?: string;
}

export interface AddWishlistItemToCartPayload {
  areaId?: string;
}

export interface CreateWishlistPayload {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateWishlistPayload {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface CustomerWishlistQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  areaId?: string;
}

export interface CustomerWishlistResponse {
  wishlist?: Wishlist;
  items: WishlistItem[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  stats?: {
    totalItems: number;
    inStockItems: number;
    priceDroppedItems: number;
    totalSavings?: number;
  };
}

export interface PublicSharedWishlistResponse {
  wishlist: Wishlist;
  items: WishlistItem[];
  isOwner?: boolean;
  sharedBy?: string;
}

export interface WishlistStats {
  totalWishlists: number;
  totalSavedItems: number;
  distinctCustomers: number;
  inStockCount: number;
  priceDropCount: number;
  todayAdditions: number;
  monthlyAdditions: number;
  avgItemsPerWishlist: number;
}
