import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../query-keys";
import { catalogService, GetCategoriesParams } from "@/lib/api/catalog-service";
import { CatalogCategory } from "@/types/catalog";

export function useCategoriesQuery(params?: GetCategoriesParams) {
  const queryParams: GetCategoriesParams = {
    page: 1,
    limit: 50,
    is_active: true,
    ...params,
  };

  return useQuery<CatalogCategory[]>({
    queryKey: QUERY_KEYS.CATALOG.CATEGORIES(queryParams as Record<string, unknown>),
    queryFn: async () => {
      return catalogService.getCategories(queryParams);
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
