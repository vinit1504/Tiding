import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { deliveryLocationAtom } from "@/stores/location-atom";
import { Product } from "@/types/product";
import { catalogService, isUuid } from "@/lib/api/catalog-service";

export function useProductDetailQuery(
  slug: string,
  variantId?: string,
  initialData?: Product | null
) {
  const location = useAtomValue(deliveryLocationAtom);
  const storeId = location?.darkStoreId && isUuid(location.darkStoreId) ? location.darkStoreId : undefined;

  return useQuery<Product | null>({
    queryKey: ["catalog", "product", slug, storeId || "default", variantId || "default"],
    queryFn: async () => {
      const product = await catalogService.getProductByIdOrSlug(slug, storeId, variantId);
      return (product as Product) || null;
    },
    enabled: Boolean(slug),
    initialData: initialData ?? undefined,
    staleTime: 0,
    refetchOnMount: true,
  });
}
