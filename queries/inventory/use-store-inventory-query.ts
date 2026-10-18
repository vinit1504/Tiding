import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../query-keys";
import { inventoryService } from "@/lib/api/inventory-service";
import { StoreInventoryItem } from "@/types/catalog";

export function useStoreInventoryQuery(storeId: string, params?: { page?: number; limit?: number }) {
  return useQuery<StoreInventoryItem[]>({
    queryKey: QUERY_KEYS.INVENTORY.STORE_INVENTORY(storeId, params as Record<string, unknown>),
    queryFn: async () => {
      if (!storeId) return [];
      return inventoryService.getStoreInventory(storeId, params);
    },
    enabled: Boolean(storeId),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
