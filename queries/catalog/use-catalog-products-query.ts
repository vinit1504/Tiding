import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../query-keys";
import { catalogService, GetCatalogProductsParams } from "@/lib/api/catalog-service";
import { CatalogProduct } from "@/types/catalog";
import { useAtomValue } from "jotai";
import { deliveryLocationAtom } from "@/stores";

export function useCatalogProductsQuery(params?: GetCatalogProductsParams) {
  const location = useAtomValue(deliveryLocationAtom);
  const storeId = location.darkStoreId;

  const mergedParams: GetCatalogProductsParams = {
    limit: 50,
    ...params,
    storeId: params?.storeId || storeId,
  };

  return useQuery<CatalogProduct[]>({
    queryKey: QUERY_KEYS.CATALOG.PRODUCTS(mergedParams as Record<string, unknown>),
    queryFn: async () => {
      return catalogService.getProducts(mergedParams);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Infinite scroll query for catalog products with 50 items per page default.
 * Automatically fetches the next page when fetchNextPage() is triggered on scroll.
 */
export function useInfiniteCatalogProductsQuery(params?: Omit<GetCatalogProductsParams, "page">) {
  const location = useAtomValue(deliveryLocationAtom);
  const storeId = location.darkStoreId;
  const limit = params?.limit || 50;

  const mergedParams = {
    ...params,
    limit,
    storeId: params?.storeId || storeId,
  };

  return useInfiniteQuery({
    queryKey: [
      ...QUERY_KEYS.CATALOG.PRODUCTS(mergedParams as Record<string, unknown>),
      "infinite",
    ],
    queryFn: async ({ pageParam = 1 }) => {
      return catalogService.getProductsPaginated({
        ...mergedParams,
        page: pageParam as number,
        limit,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const pagination = lastPage?.meta?.pagination;
      if (pagination && typeof pagination.hasNextPage === "boolean") {
        return pagination.hasNextPage ? (pagination.page || allPages.length) + 1 : undefined;
      }
      // Fallback: If returned items count is equal to limit, assume next page exists
      if (lastPage?.data && lastPage.data.length >= limit) {
        return allPages.length + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
