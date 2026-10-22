export const QUERY_KEYS = {
  CATALOG: {
    ALL: ["catalog"] as const,
    CATEGORIES: (params?: Record<string, unknown>) => [...QUERY_KEYS.CATALOG.ALL, "categories", params] as const,
    CATEGORY: (slug: string) => [...QUERY_KEYS.CATALOG.ALL, "category", slug] as const,
    SUBCATEGORIES: (categoryId?: string) => [...QUERY_KEYS.CATALOG.ALL, "subcategories", categoryId] as const,
    SUBCATEGORY: (id: string) => [...QUERY_KEYS.CATALOG.ALL, "subcategory", id] as const,
    BRANDS: (params?: Record<string, unknown>) => [...QUERY_KEYS.CATALOG.ALL, "brands", params] as const,
    BRAND: (id: string) => [...QUERY_KEYS.CATALOG.ALL, "brand", id] as const,
    PRODUCTS: (params?: Record<string, unknown>) => [...QUERY_KEYS.CATALOG.ALL, "products", params] as const,
    PRODUCT: (slug: string) => [...QUERY_KEYS.CATALOG.ALL, "product", slug] as const,
    FLASH_DEALS: () => [...QUERY_KEYS.CATALOG.ALL, "flash-deals"] as const,
    SUGGESTIONS: (query: string) => [...QUERY_KEYS.CATALOG.ALL, "suggestions", query] as const,
  },
  INVENTORY: {
    ALL: ["inventory"] as const,
    STORE_INVENTORY: (storeId: string, params?: Record<string, unknown>) =>
      [...QUERY_KEYS.INVENTORY.ALL, "store", storeId, params] as const,
  },
  LOCATION: {
    ALL: ["location"] as const,
    GEOCODE: (lat: number, lng: number) => [...QUERY_KEYS.LOCATION.ALL, "geocode", lat, lng] as const,
    SERVICE_AREA: (pincode: string) => [...QUERY_KEYS.LOCATION.ALL, "service-area", pincode] as const,
    DARK_STORES: () => [...QUERY_KEYS.LOCATION.ALL, "dark-stores"] as const,
    RESOLVE_DELIVERY: (lat: number, lng: number) => [...QUERY_KEYS.LOCATION.ALL, "resolve-delivery", lat, lng] as const,
  },
  CART: {
    ALL: ["cart"] as const,
    DETAIL: () => [...QUERY_KEYS.CART.ALL, "detail"] as const,
  },
  CHECKOUT: {
    ALL: ["checkout"] as const,
    ACTIVE: () => [...QUERY_KEYS.CHECKOUT.ALL, "active"] as const,
    DETAIL: (checkoutId: string) => [...QUERY_KEYS.CHECKOUT.ALL, "detail", checkoutId] as const,
  },
  ORDERS: {
    ALL: ["orders"] as const,
    LIST: (page = 1, limit = 20) => [...QUERY_KEYS.ORDERS.ALL, "list", { page, limit }] as const,
    DETAIL: (orderId: string) => [...QUERY_KEYS.ORDERS.ALL, "detail", orderId] as const,
  },
  USER: {
    ALL: ["user"] as const,
    PROFILE: () => [...QUERY_KEYS.USER.ALL, "profile"] as const,
    ADDRESSES: () => [...QUERY_KEYS.USER.ALL, "addresses"] as const,
  },
  AUTH: {
    ALL: ["auth"] as const,
    SESSION: () => [...QUERY_KEYS.AUTH.ALL, "session"] as const,
    SESSIONS: () => [...QUERY_KEYS.AUTH.ALL, "device-sessions"] as const,
  },
  COUPONS: {
    ALL: ["coupons"] as const,
    LIST: (params?: Record<string, unknown>) => [...QUERY_KEYS.COUPONS.ALL, "list", params] as const,
    ELIGIBILITY: (couponId: string) => [...QUERY_KEYS.COUPONS.ALL, "eligibility", couponId] as const,
    USAGES: (params?: Record<string, unknown>) => [...QUERY_KEYS.COUPONS.ALL, "usages", params] as const,
  },
  PAYMENTS: {
    ALL: ["payments"] as const,
    LIST: () => [...QUERY_KEYS.PAYMENTS.ALL, "list"] as const,
    DETAIL: (paymentId: string) => [...QUERY_KEYS.PAYMENTS.ALL, "detail", paymentId] as const,
  },
  WISHLISTS: {
    ALL: ["wishlists"] as const,
    MY: () => [...QUERY_KEYS.WISHLISTS.ALL, "my"] as const,
    DEFAULT: () => [...QUERY_KEYS.WISHLISTS.ALL, "default"] as const,
    DETAIL: (id: string) => [...QUERY_KEYS.WISHLISTS.ALL, "detail", id] as const,
  },
  REVIEWS: {
    ALL: ["reviews"] as const,
    PRODUCT: (productId: string) => [...QUERY_KEYS.REVIEWS.ALL, "product", productId] as const,
    MY: () => [...QUERY_KEYS.REVIEWS.ALL, "my"] as const,
  },
} as const;
