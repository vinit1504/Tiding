import { apiClient } from "./api-client";
import { API_ENDPOINTS } from "@/lib/constants/api-endpoints";
import { StoreDetail } from "@/types/store";

export class StoreService {
  /**
   * 1. GET /api/v1/stores/:storeId
   * Retrieve active dark store details and operational settings (including handling_fee)
   */
  async getStoreDetails(storeId: string): Promise<StoreDetail | null> {
    if (!storeId) return null;
    try {
      const res = await apiClient.get<StoreDetail | { data: StoreDetail }>(
        API_ENDPOINTS.STORES.DETAIL(storeId)
      );
      if (res && "data" in res && (res as any).data) {
        return (res as any).data;
      }
      return res as StoreDetail;
    } catch (err) {
      console.warn(`Failed to fetch store details for ${storeId}:`, err);
      return null;
    }
  }
}

export const storeService = new StoreService();

