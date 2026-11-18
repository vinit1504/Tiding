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
      const res = await apiClient.get<StoreDetail | { data: StoreDetail } | null>(
        API_ENDPOINTS.STORES.DETAIL(storeId),
        null
      );
      if (res && typeof res === "object" && "data" in res && (res as any).data) {
        return (res as any).data;
      }
      return (res as StoreDetail) || null;
    } catch {
      return null;
    }
  }
}

export const storeService = new StoreService();

