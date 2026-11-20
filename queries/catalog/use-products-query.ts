import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../query-keys";
import { Product } from "@/types/product";
import { catalogService, isUuid } from "@/lib/api/catalog-service";
import { useAtomValue } from "jotai";
import { deliveryLocationAtom } from "@/stores";

interface ProductsQueryParams {
  categorySlug?: string;
  subcategorySlug?: string;
  search?: string;
  limit?: number;
  storeId?: string;
}

export function useProductsQuery(params?: ProductsQueryParams) {
  const location = useAtomValue(deliveryLocationAtom);
  const storeId = params?.storeId || location.darkStoreId;

  const queryParams = { limit: 50, ...params, storeId };
  return useQuery<Product[]>({
    queryKey: QUERY_KEYS.CATALOG.PRODUCTS(queryParams as Record<string, unknown>),
    queryFn: async () => {
      const products = await catalogService.getProducts({
        limit: queryParams.limit || 50,
        search: queryParams.search,
        storeId,
      });

      let list = products;
      if (queryParams.categorySlug && queryParams.categorySlug !== "all") {
        list = list.filter(
          (p) =>
            p.category_slug === queryParams.categorySlug ||
            (isUuid(queryParams.categorySlug) && p.category_id === queryParams.categorySlug)
        );
      }
      if (queryParams.subcategorySlug) {
        list = list.filter(
          (p) =>
            p.subcategory_id === queryParams.subcategorySlug ||
            p.subcategory_name?.toLowerCase().includes(queryParams.subcategorySlug!.toLowerCase())
        );
      }
      if (queryParams.limit) {
        list = list.slice(0, queryParams.limit);
      }

      return list as Product[];
    },
    staleTime: 1000 * 60 * 3,
  });
}

export function useInfiniteProductsQuery(params?: Omit<ProductsQueryParams, "page">) {
  const location = useAtomValue(deliveryLocationAtom);
  const storeId = params?.storeId || location.darkStoreId;
  const limit = params?.limit || 50;

  const queryParams = { ...params, storeId, limit };

  return useInfiniteQuery({
    queryKey: [
      ...QUERY_KEYS.CATALOG.PRODUCTS(queryParams as Record<string, unknown>),
      "infinite",
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await catalogService.getProductsPaginated({
        page: pageParam as number,
        limit,
        search: queryParams.search,
        storeId,
      });

      let list = res.data;
      if (queryParams.categorySlug && queryParams.categorySlug !== "all") {
        list = list.filter(
          (p) =>
            p.category_slug === queryParams.categorySlug ||
            (isUuid(queryParams.categorySlug) && p.category_id === queryParams.categorySlug)
        );
      }
      if (queryParams.subcategorySlug) {
        list = list.filter(
          (p) =>
            p.subcategory_id === queryParams.subcategorySlug ||
            p.subcategory_name?.toLowerCase().includes(queryParams.subcategorySlug!.toLowerCase())
        );
      }

      return {
        data: list as Product[],
        meta: res.meta,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const pagination = lastPage?.meta?.pagination;
      if (pagination && typeof pagination.hasNextPage === "boolean") {
        return pagination.hasNextPage ? (pagination.page || allPages.length) + 1 : undefined;
      }
      if (lastPage?.data && lastPage.data.length >= limit) {
        return allPages.length + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 3,
  });
}
