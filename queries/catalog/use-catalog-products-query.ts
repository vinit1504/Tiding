import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../query-keys";
import { catalogService, GetCatalogProductsParams } from "@/lib/api/catalog-service";
import { CatalogProduct } from "@/types/catalog";

export function useCatalogProductsQuery(params?: GetCatalogProductsParams) {
  const queryParams = params || {};
  return useQuery<CatalogProduct[]>({
    queryKey: QUERY_KEYS.CATALOG.PRODUCTS(queryParams as Record<string, unknown>),
    queryFn: async () => {
      return catalogService.getProducts(queryParams);
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}
