import { useQuery } from "@tanstack/react-query";
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

  const queryParams = { ...params, storeId };
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
