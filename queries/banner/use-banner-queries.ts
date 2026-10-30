import { useQuery } from "@tanstack/react-query";
import { bannerService } from "@/lib/api/banner-service";
import { QUERY_KEYS } from "@/queries/query-keys";
import { CmsBanner, CmsBannerFilters } from "@/types/cms-banner";

/**
 * Hook to fetch customer storefront CMS banners
 * Supports placement (e.g. HOME_HERO) and device target
 */
export function useBannersQuery(filters: CmsBannerFilters = { placement: "HOME_HERO" }) {
  return useQuery<CmsBanner[]>({
    queryKey: QUERY_KEYS.CMS.BANNERS(filters as Record<string, unknown>),
    queryFn: () => bannerService.getStorefrontBanners(filters),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}
