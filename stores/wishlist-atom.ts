import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Wishlist, WishlistItem } from "@/types/wishlist";

// Stored distinct wishlisted Product IDs (used for 1:1 accurate count & heart rendering)
export const wishlistProductIdsAtom = atomWithStorage<string[]>(
  "tiding_wishlist_product_ids",
  []
);

// Stored distinct wishlisted Variant IDs
export const wishlistVariantIdsAtom = atomWithStorage<string[]>(
  "tiding_wishlist_variant_ids",
  []
);

// Combined lookup IDs (union of productIds & variantIds) for fast isWishlisted check
export const wishlistIdsAtom = atom<string[]>((get) => {
  const pIds = get(wishlistProductIdsAtom);
  const vIds = get(wishlistVariantIdsAtom);
  return Array.from(new Set([...pIds, ...vIds]));
});

// Map of productId / variantId -> wishlistItemId for instant removal
export const wishlistItemIdMapAtom = atomWithStorage<Record<string, string>>(
  "tiding_wishlist_item_map",
  {}
);

// Active / default wishlist details
export const activeWishlistAtom = atom<Wishlist | null>(null);

// Customer's loaded wishlist items
export const customerWishlistItemsAtom = atom<WishlistItem[]>([]);

// Direct authoritative count provided by backend API (/wishlist/ids or /wishlist)
export const wishlistServerCountAtom = atom<number | null>(null);

// Derived count of wishlisted items (strictly authoritative, 1 product = 1 count, NEVER doubled)
export const wishlistCountAtom = atom((get) => {
  const serverCount = get(wishlistServerCountAtom);
  if (typeof serverCount === "number") return serverCount;

  const items = get(customerWishlistItemsAtom);
  if (items.length > 0) return items.length;

  const productIds = get(wishlistProductIdsAtom);
  if (productIds.length > 0) return productIds.length;

  const itemMap = get(wishlistItemIdMapAtom);
  const uniqueItemIds = new Set(Object.values(itemMap));
  if (uniqueItemIds.size > 0) return uniqueItemIds.size;

  return 0;
});
