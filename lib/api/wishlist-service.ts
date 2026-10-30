import { apiClient } from "./api-client";
import { API_ENDPOINTS } from "@/lib/constants/api-endpoints";
import {
  Wishlist,
  WishlistItem,
  WishlistIdsResponse,
  AddWishlistItemPayload,
  UpdateWishlistItemPayload,
  AddWishlistItemToCartPayload,
  CreateWishlistPayload,
  UpdateWishlistPayload,
  CustomerWishlistQuery,
  CustomerWishlistResponse,
  PublicSharedWishlistResponse,
} from "@/types/wishlist";

class WishlistService {
  /**
   * Retrieves authenticated customer's wishlist with real-time location-based stock
   * availability and price-drop calculations.
   */
  async getCustomerWishlist(
    params: CustomerWishlistQuery = {}
  ): Promise<CustomerWishlistResponse> {
    const { page = 1, limit = 20, sortBy, sortOrder, areaId } = params;
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (sortBy) query.append("sortBy", sortBy);
    if (sortOrder) query.append("sortOrder", sortOrder);

    const headers: Record<string, string> = {};
    if (areaId) {
      headers["X-Area-Id"] = areaId;
    }

    const endpoint = `${API_ENDPOINTS.WISHLIST.ROOT}?${query.toString()}`;
    const res = await apiClient.get<any>(endpoint, { headers });

    // Handle flexible backend response structures
    if (res && Array.isArray(res.items)) {
      return {
        wishlist: res.wishlist,
        items: res.items,
        total: res.total ?? res.items.length,
        page: res.page ?? page,
        limit: res.limit ?? limit,
        totalPages: res.totalPages ?? Math.ceil((res.total ?? res.items.length) / limit),
        stats: res.stats,
      };
    } else if (Array.isArray(res)) {
      return {
        items: res,
        total: res.length,
        page,
        limit,
        totalPages: 1,
      };
    } else if (res && res.data && Array.isArray(res.data)) {
      return {
        items: res.data,
        total: res.meta?.total ?? res.data.length,
        page: res.meta?.page ?? page,
        limit: res.meta?.limit ?? limit,
        totalPages: res.meta?.totalPages ?? 1,
        stats: res.stats,
      };
    }

    return {
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }

  /**
   * Lightweight endpoint returning all wishlisted product and variant IDs
   * for rapid UI synchronization of heart icons.
   */
  async getWishlistIds(): Promise<WishlistIdsResponse> {
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.WISHLIST.IDS);

      if (Array.isArray(res)) {
        return {
          productIds: res.map((id) => String(id)),
          variantIds: [],
          itemIds: [],
        };
      }

      const productIds: string[] = Array.isArray(res?.productIds)
        ? res.productIds.map(String)
        : [];
      const variantIds: string[] = Array.isArray(res?.variantIds)
        ? res.variantIds.map(String)
        : [];
      const itemIds: string[] = Array.isArray(res?.itemIds)
        ? res.itemIds.map(String)
        : [];

      return {
        productIds,
        variantIds,
        itemIds,
        items: Array.isArray(res?.items) ? res.items : undefined,
      };
    } catch {
      return { productIds: [], variantIds: [], itemIds: [] };
    }
  }

  /**
   * Retrieves all wishlists created by authenticated customer.
   */
  async getMyWishlists(): Promise<Wishlist[]> {
    const res = await apiClient.get<any>(API_ENDPOINTS.WISHLIST.MY);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.wishlists)) return res.wishlists;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  }

  /**
   * Public read-only view of a wishlist shared via unique share token (No auth required).
   */
  async getPublicWishlist(
    shareToken: string
  ): Promise<PublicSharedWishlistResponse> {
    const endpoint = API_ENDPOINTS.WISHLIST.SHARE_PUBLIC(shareToken);
    const res = await apiClient.get<any>(endpoint);
    if (res?.wishlist) {
      return res;
    }
    return {
      wishlist: res,
      items: res?.items || [],
      isOwner: res?.isOwner,
      sharedBy: res?.sharedBy,
    };
  }

  /**
   * Adds item with current price snapshot for price-drop alert monitoring.
   */
  async addItem(payload: AddWishlistItemPayload): Promise<WishlistItem> {
    return await apiClient.post<WishlistItem, AddWishlistItemPayload>(
      API_ENDPOINTS.WISHLIST.ITEMS,
      payload
    );
  }

  /**
   * Updates item priority, notes, and price drop notifications.
   */
  async updateItem(
    itemId: string,
    payload: UpdateWishlistItemPayload
  ): Promise<WishlistItem> {
    return await apiClient.patch<WishlistItem, UpdateWishlistItemPayload>(
      API_ENDPOINTS.WISHLIST.ITEM(itemId),
      payload
    );
  }

  /**
   * Removes item from customer wishlist with ownership check.
   */
  async removeItem(itemId: string): Promise<{ success: boolean; message?: string }> {
    return await apiClient.delete<{ success: boolean; message?: string }>(
      API_ENDPOINTS.WISHLIST.ITEM(itemId)
    );
  }

  /**
   * Empties the customer's wishlist items.
   */
  async clearWishlist(): Promise<{ success: boolean; message?: string }> {
    return await apiClient.delete<{ success: boolean; message?: string }>(
      API_ENDPOINTS.WISHLIST.ITEMS
    );
  }

  /**
   * Revalidates product and serving store inventory, and transfers item to active customer
   * cart without deleting the wishlist entry.
   */
  async addItemToCart(
    itemId: string,
    areaId?: string
  ): Promise<{ success: boolean; message?: string; cart?: unknown }> {
    return await apiClient.post<any, AddWishlistItemToCartPayload>(
      API_ENDPOINTS.WISHLIST.ITEM_TO_CART(itemId),
      { areaId }
    );
  }

  /**
   * Batch transfers all available in-stock wishlist items into active cart.
   */
  async moveAllToCart(
    wishlistId: string
  ): Promise<{ success: boolean; transferredCount?: number; message?: string }> {
    return await apiClient.post<any, Record<string, never>>(
      API_ENDPOINTS.WISHLIST.MOVE_ALL_TO_CART(wishlistId),
      {}
    );
  }

  /**
   * Generates or toggles secure public share link token.
   */
  async generateShareLink(
    wishlistId: string
  ): Promise<{ shareToken: string; shareUrl?: string; isPublic: boolean }> {
    return await apiClient.post<any, Record<string, never>>(
      API_ENDPOINTS.WISHLIST.SHARE(wishlistId),
      {}
    );
  }

  /**
   * Designates this wishlist as customer's primary default list.
   */
  async setDefaultWishlist(
    wishlistId: string
  ): Promise<{ success: boolean; message?: string; wishlist: Wishlist }> {
    return await apiClient.patch<any, Record<string, never>>(
      API_ENDPOINTS.WISHLIST.DEFAULT(wishlistId),
      {}
    );
  }

  /**
   * Creates a new custom wishlist.
   */
  async createWishlist(payload: CreateWishlistPayload): Promise<Wishlist> {
    return await apiClient.post<Wishlist, CreateWishlistPayload>(
      API_ENDPOINTS.WISHLIST.ROOT,
      payload
    );
  }

  /**
   * Fetches single wishlist details with items and price drop indicators.
   */
  async getWishlistById(wishlistId: string): Promise<Wishlist> {
    return await apiClient.get<Wishlist>(
      API_ENDPOINTS.WISHLIST.DETAIL(wishlistId)
    );
  }

  /**
   * Updates wishlist name, description, or privacy.
   */
  async updateWishlist(
    wishlistId: string,
    payload: UpdateWishlistPayload
  ): Promise<Wishlist> {
    return await apiClient.patch<Wishlist, UpdateWishlistPayload>(
      API_ENDPOINTS.WISHLIST.DETAIL(wishlistId),
      payload
    );
  }

  /**
   * Soft-deletes wishlist and its items.
   */
  async deleteWishlist(wishlistId: string): Promise<{ success: boolean }> {
    return await apiClient.delete<{ success: boolean }>(
      API_ENDPOINTS.WISHLIST.DETAIL(wishlistId)
    );
  }

  /**
   * Restores soft-deleted wishlist from trash.
   */
  async restoreWishlist(wishlistId: string): Promise<{ success: boolean; wishlist: Wishlist }> {
    return await apiClient.post<any, Record<string, never>>(
      API_ENDPOINTS.WISHLIST.RESTORE(wishlistId),
      {}
    );
  }

  /**
   * Hard-deletes wishlist and its items from database.
   */
  async permanentDeleteWishlist(wishlistId: string): Promise<{ success: boolean }> {
    return await apiClient.delete<{ success: boolean }>(
      API_ENDPOINTS.WISHLIST.PERMANENT(wishlistId)
    );
  }
}

export const wishlistService = new WishlistService();
