import { apiClient } from "./api-client";
import { API_ENDPOINTS } from "@/lib/constants/api-endpoints";
import { CmsBanner, CmsBannerFilters } from "@/types/cms-banner";

// Default vibrant luxury color palettes for banners without custom gradient
const BANNER_GRADIENTS = [
  "from-[#087838] via-[#0D873F] to-[#18A818]", // Emerald Fresh
  "from-[#312E81] via-[#4338CA] to-[#6366F1]", // Deep Indigo
  "from-[#9A3412] via-[#C2410C] to-[#EA580C]", // Sunset Flame
  "from-[#1E3A8A] via-[#1D4ED8] to-[#3B82F6]", // Royal Sapphire
  "from-[#831843] via-[#9D174D] to-[#BE185D]", // Ruby Berry
  "from-[#134E4A] via-[#0F766E] to-[#0D9488]", // Ocean Teal
  "from-[#701A75] via-[#86198F] to-[#A21CAF]", // Mystic Orchid
  "from-[#78350F] via-[#92400E] to-[#B45309]", // Warm Amber
];

export class BannerService {
  /**
   * Normalizes raw API response item into standard CmsBanner
   */
  private normalizeBanner(item: any, index: number): CmsBanner {
    const raw = item || {};
    const linkUrl = raw.link_url || raw.linkUrl || raw.url || null;
    let categorySlug = raw.category_slug || raw.categorySlug || null;

    if (!categorySlug && linkUrl) {
      const match = linkUrl.match(/\/collections\/([^/?#]+)/) || linkUrl.match(/\/category\/([^/?#]+)/);
      if (match) {
        categorySlug = match[1];
      }
    }

    return {
      id: String(raw.id || `banner-${index + 1}`),
      title: String(raw.title || raw.headline || ""),
      subtitle: raw.subtitle || raw.subtext || raw.description || null,
      badge_text: raw.badge_text || raw.badgeText || raw.badge || null,
      image_url: raw.image_url || raw.imageUrl || raw.image || "",
      mobile_image_url: raw.mobile_image_url || raw.mobileImageUrl || raw.image_url || raw.imageUrl || null,
      button_text: raw.button_text || raw.buttonText || raw.cta || "Shop Now",
      link_url: linkUrl,
      link_target: raw.link_target || raw.linkTarget || "_self",
      placement: raw.placement || "HOME_HERO",
      device_target: raw.device_target || raw.deviceTarget || "ALL",
      display_order: Number(raw.display_order ?? raw.displayOrder ?? raw.order ?? index + 1),
      status: raw.status || "PUBLISHED",
      is_active: raw.is_active !== undefined ? Boolean(raw.is_active) : true,
      bg_gradient: raw.bg_gradient || raw.bgGradient || BANNER_GRADIENTS[index % BANNER_GRADIENTS.length],
      accent_color: raw.accent_color || raw.accentColor || "#FFFFFF",
      category_slug: categorySlug,
      created_at: raw.created_at || raw.createdAt,
      updated_at: raw.updated_at || raw.updatedAt,
    };
  }

  /**
   * Fetch active storefront CMS banners directly from Backend API
   * GET /api/v1/cms/banners?placement=HOME_HERO
   */
  async getStorefrontBanners(filters: CmsBannerFilters = {}): Promise<CmsBanner[]> {
    const placement = filters.placement || "HOME_HERO";
    const params = new URLSearchParams({
      placement,
    });

    if (filters.device_target) {
      params.set("device_target", filters.device_target);
    }
    if (filters.limit) {
      params.set("limit", String(filters.limit));
    }

    try {
      // Customer storefront endpoint: /api/v1/cms/banners
      const res = await apiClient.get<any>(`${API_ENDPOINTS.CMS.BANNERS}?${params.toString()}`);

      let bannerList: any[] = [];
      if (Array.isArray(res)) {
        bannerList = res;
      } else if (res && Array.isArray(res.data)) {
        bannerList = res.data;
      } else if (res && Array.isArray(res.banners)) {
        bannerList = res.banners;
      }

      if (bannerList.length > 0) {
        return bannerList
          .filter((b) => b.is_active !== false && (!b.status || b.status === "PUBLISHED"))
          .sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0))
          .map((item, idx) => this.normalizeBanner(item, idx));
      }

      return [];
    } catch {
      return [];
    }
  }
}

export const bannerService = new BannerService();
