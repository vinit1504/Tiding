import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../query-keys";
import { catalogService, GetBrandsParams } from "@/lib/api/catalog-service";
import { CatalogBrand } from "@/types/catalog";

export function useBrandsQuery(params?: GetBrandsParams) {
  return useQuery<CatalogBrand[]>({
    queryKey: QUERY_KEYS.CATALOG.BRANDS(params as Record<string, unknown>),
    queryFn: async () => {
      return catalogService.getBrands(params);
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}
