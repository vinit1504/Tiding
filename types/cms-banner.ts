// ============================================================================
// CMS Banner Data Contracts & Interfaces
// ============================================================================

export type CmsBannerPlacement =
  | "HOME_HERO"
  | "HOME_MIDDLE"
  | "CATEGORY_HEADER"
  | "CHECKOUT_PROMO"
  | "CART_SIDEBAR";

export type CmsBannerDeviceTarget = "ALL" | "DESKTOP" | "MOBILE";

export type CmsBannerStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface CmsBanner {
  id: string;
  title: string;
  subtitle?: string | null;
  badge_text?: string | null;
  image_url: string;
  mobile_image_url?: string | null;
  button_text?: string | null;
  link_url?: string | null;
  link_target?: "_self" | "_blank" | string;
  placement?: CmsBannerPlacement | string;
  device_target?: CmsBannerDeviceTarget | string;
  display_order?: number;
  status?: CmsBannerStatus | string;
  is_active?: boolean;
  bg_gradient?: string | null;
  accent_color?: string | null;
  category_slug?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CmsBannerFilters {
  placement?: string;
  device_target?: string;
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface CmsBannerListResponse {
  banners: CmsBanner[];
  total?: number;
}
