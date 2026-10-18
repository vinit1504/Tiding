import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../query-keys";
import { catalogService, GetSubcategoriesParams } from "@/lib/api/catalog-service";
import { CatalogSubcategory } from "@/types/catalog";

export function useSubcategoriesQuery(params: GetSubcategoriesParams) {
  return useQuery<CatalogSubcategory[]>({
    queryKey: QUERY_KEYS.CATALOG.SUBCATEGORIES(params.category_id),
    queryFn: async () => {
      return catalogService.getSubcategories(params);
    },
    enabled: Boolean(params.category_id),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useInfiniteSubcategoriesQuery(params: Omit<GetSubcategoriesParams, "page">) {
  return useInfiniteQuery({
    queryKey: [
      ...QUERY_KEYS.CATALOG.SUBCATEGORIES(params.category_id),
      "infinite",
      params.limit || 20,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      return catalogService.getSubcategoriesPaginated({
        ...params,
        page: pageParam as number,
        limit: params.limit || 20,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.meta?.pagination;
      if (pagination && pagination.hasNextPage) {
        return (pagination.page || 1) + 1;
      }
      return undefined;
    },
    enabled: Boolean(params.category_id),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
