import { apiClient } from "./api-client";
import {
  StoreInventoryItem,
  StoreInventoryResponse,
} from "@/types/catalog";

export interface UpsertStoreInventoryDto {
  product_variant_id: string;
  stock_quantity: number;
  reserved_quantity?: number;
  low_stock_threshold?: number;
  is_available?: boolean;
}

export interface UpdateStoreInventoryDto {
  stock_quantity?: number;
  reserved_quantity?: number;
  low_stock_threshold?: number;
  is_available?: boolean;
}

class InventoryService {
  /**
   * List store inventory for dark store
   * GET /api/v1/stores/:storeId/inventory?page=1&limit=20
   */
  async getStoreInventory(
    storeId: string,
    params?: { page?: number; limit?: number }
  ): Promise<StoreInventoryItem[]> {
    if (!storeId) return [];

    const page = params?.page || 1;
    const limit = params?.limit || 50;

    try {
      const response = await apiClient.get<StoreInventoryResponse | StoreInventoryItem[]>(
        `/stores/${storeId}/inventory?page=${page}&limit=${limit}`
      );

      if (Array.isArray(response)) {
        return response;
      }
      if (response && "inventory" in response && Array.isArray(response.inventory)) {
        return response.inventory;
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Set or Upsert store inventory for a variant
   * POST /api/v1/stores/:storeId/inventory
   */
  async setStoreInventory(
    storeId: string,
    body: UpsertStoreInventoryDto
  ): Promise<StoreInventoryItem> {
    return apiClient.post<StoreInventoryItem, UpsertStoreInventoryDto>(
      `/stores/${storeId}/inventory`,
      body
    );
  }

  /**
   * Update store inventory for a variant
   * PATCH /api/v1/stores/:storeId/inventory/:variantId
   */
  async updateStoreInventory(
    storeId: string,
    variantId: string,
    body: UpdateStoreInventoryDto
  ): Promise<StoreInventoryItem> {
    return apiClient.patch<StoreInventoryItem, UpdateStoreInventoryDto>(
      `/stores/${storeId}/inventory/${variantId}`,
      body
    );
  }

  /**
   * Soft-delete variant inventory from store
   * DELETE /api/v1/stores/:storeId/inventory/:variantId
   */
  async deleteStoreInventory(
    storeId: string,
    variantId: string
  ): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(
      `/stores/${storeId}/inventory/${variantId}`
    );
  }

  /**
   * Permanent delete inventory (Admin)
   * DELETE /api/v1/stores/:storeId/inventory/:variantId/permanent
   */
  async permanentDeleteStoreInventory(
    storeId: string,
    variantId: string
  ): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(
      `/stores/${storeId}/inventory/${variantId}/permanent`
    );
  }
}

export const inventoryService = new InventoryService();
