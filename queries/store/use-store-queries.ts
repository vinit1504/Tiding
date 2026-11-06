"use client";

import { useQuery } from "@tanstack/react-query";
import { storeService } from "@/lib/api/store-service";
import { QUERY_KEYS } from "@/queries/query-keys";
import { StoreDetail } from "@/types/store";

export function useStoreDetailsQuery(storeId?: string | null) {
  return useQuery<StoreDetail | null>({
    queryKey: QUERY_KEYS.STORES.DETAIL(storeId || ""),
    queryFn: () => (storeId ? storeService.getStoreDetails(storeId) : Promise.resolve(null)),
    enabled: !!storeId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

