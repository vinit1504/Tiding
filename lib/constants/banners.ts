import { CmsBanner } from "@/types/cms-banner";

/**
 * High-quality static fallback promotional banners for Tiding Storefront.
 * Used when the CMS banners API is empty or temporarily unreachable,
 * guaranteeing a vibrant, interactive carousel at all times.
 */
export const STATIC_PROMO_BANNERS: CmsBanner[] = [
  {
    id: "static-banner-fresh-farm",
    title: "Farm Fresh Vegetables & Fruits",
    subtitle: "Handpicked daily from local organic farms • 100% pesticide-free",
    badge_text: "UP TO 40% OFF",
    image_url:
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=1200&auto=format&fit=crop&q=80",
    mobile_image_url:
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&auto=format&fit=crop&q=80",
    button_text: "Shop Fresh",
    link_url: "/category/vegetables-fruits",
    category_slug: "vegetables-fruits",
    placement: "HOME_HERO",
    device_target: "ALL",
    display_order: 1,
    status: "PUBLISHED",
    is_active: true,
    bg_gradient: "from-[#087838] via-[#0D873F] to-[#18A818]",
    accent_color: "#18A818",
  },
  {
    id: "static-banner-dairy-eggs",
    title: "Morning Dairy Essentials & Eggs",
    subtitle: "Pure whole milk, paneer, butter & farm-fresh brown eggs",
    badge_text: "DAILY ESSENTIALS",
    image_url:
      "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=1200&auto=format&fit=crop&q=80",
    mobile_image_url:
      "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=800&auto=format&fit=crop&q=80",
    button_text: "Order Daily",
    link_url: "/category/dairy-bread-eggs",
    category_slug: "dairy-bread-eggs",
    placement: "HOME_HERO",
    device_target: "ALL",
    display_order: 2,
    status: "PUBLISHED",
    is_active: true,
    bg_gradient: "from-[#1E3A8A] via-[#1D4ED8] to-[#3B82F6]",
    accent_color: "#3B82F6",
  },
  {
    id: "static-banner-munchies-drinks",
    title: "Snacks, Munchies & Cold Drinks",
    subtitle: "Chilled beverages, artisanal chips, biscuits & gourmet cookies",
    badge_text: "SUPER SAVER",
    image_url:
      "https://images.unsplash.com/photo-1621939517670-e89a82b5116f?w=1200&auto=format&fit=crop&q=80",
    mobile_image_url:
      "https://images.unsplash.com/photo-1621939517670-e89a82b5116f?w=800&auto=format&fit=crop&q=80",
    button_text: "Grab Deals",
    link_url: "/category/snacks-munchies",
    category_slug: "snacks-munchies",
    placement: "HOME_HERO",
    device_target: "ALL",
    display_order: 3,
    status: "PUBLISHED",
    is_active: true,
    bg_gradient: "from-[#9A3412] via-[#C2410C] to-[#EA580C]",
    accent_color: "#EA580C",
  },
  {
    id: "static-banner-express-speed",
    title: "Lightning Express 10-Min Delivery",
    subtitle: "Instant groceries delivered hot & cold straight to your doorstep",
    badge_text: "⚡ 10 MINS DELIVERY",
    image_url:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80",
    mobile_image_url:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80",
    button_text: "Explore Now",
    link_url: "/category/all",
    category_slug: "all",
    placement: "HOME_HERO",
    device_target: "ALL",
    display_order: 4,
    status: "PUBLISHED",
    is_active: true,
    bg_gradient: "from-[#134E4A] via-[#0F766E] to-[#0D9488]",
    accent_color: "#0D9488",
  },
];
