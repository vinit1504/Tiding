import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../query-keys";
import { Product } from "@/types/product";
import { catalogService } from "@/lib/api/catalog-service";

export function useProductDetailQuery(slug: string) {
  return useQuery<Product | null>({
    queryKey: QUERY_KEYS.CATALOG.PRODUCT(slug),
    queryFn: async () => {
      const product = await catalogService.getProductByIdOrSlug(slug);
      return (product as Product) || null;
    },
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 5,
  });
}
