import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../query-keys";
import { catalogService, GetCatalogProductsParams } from "@/lib/api/catalog-service";
import { CatalogProduct } from "@/types/catalog";
import { useAtomValue } from "jotai";
import { deliveryLocationAtom } from "@/stores";

export function useCatalogProductsQuery(params?: GetCatalogProductsParams) {
  const location = useAtomValue(deliveryLocationAtom);
  const storeId = location.darkStoreId;

  const mergedParams: GetCatalogProductsParams = {
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
