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
    COUNTRIES: (params?: Record<string, unknown>) => [...QUERY_KEYS.LOCATION.ALL, "countries", params] as const,
    STATES: (countryId?: string, params?: Record<string, unknown>) =>
      [...QUERY_KEYS.LOCATION.ALL, "states", countryId, params] as const,
    CITIES: (stateId?: string, params?: Record<string, unknown>) =>
      [...QUERY_KEYS.LOCATION.ALL, "cities", stateId, params] as const,
    PINCODES: (cityId?: string, params?: Record<string, unknown>) =>
      [...QUERY_KEYS.LOCATION.ALL, "pincodes", cityId, params] as const,
    AREAS: (params?: Record<string, unknown>) => [...QUERY_KEYS.LOCATION.ALL, "areas", params] as const,
    AREA_BY_SLUG: (slug: string) => [...QUERY_KEYS.LOCATION.ALL, "area-slug", slug] as const,
    AREA_BY_ID: (id: string) => [...QUERY_KEYS.LOCATION.ALL, "area-id", id] as const,
    GEOCODE: (lat: number, lng: number) => [...QUERY_KEYS.LOCATION.ALL, "geocode", lat, lng] as const,
    SERVICE_AREA: (pincode: string) => [...QUERY_KEYS.LOCATION.ALL, "service-area", pincode] as const,
    DARK_STORES: () => [...QUERY_KEYS.LOCATION.ALL, "dark-stores"] as const,
    RESOLVE_DELIVERY: (lat: number, lng: number) => [...QUERY_KEYS.LOCATION.ALL, "resolve-delivery", lat, lng] as const,
  },
  CART: {
    ALL: ["cart"] as const,
    DETAIL: (userId?: string | null) => [...QUERY_KEYS.CART.ALL, userId || "guest", "detail"] as const,
  },
  CHECKOUT: {
    ALL: ["checkout"] as const,
    ACTIVE: (userId?: string | null) => [...QUERY_KEYS.CHECKOUT.ALL, userId || "guest", "active"] as const,
    DETAIL: (checkoutId: string, userId?: string | null) =>
      [...QUERY_KEYS.CHECKOUT.ALL, userId || "guest", "detail", checkoutId] as const,
  },
  ORDERS: {
    ALL: ["orders"] as const,
    USER: (userId?: string | null) => [...QUERY_KEYS.ORDERS.ALL, userId || "anonymous"] as const,
    LIST: (userId?: string | null, paramsOrPage?: number | Record<string, unknown>, limit = 20) => {
      const scope = userId || "anonymous";
      if (typeof paramsOrPage === "object" && paramsOrPage !== null) {
        return [...QUERY_KEYS.ORDERS.ALL, scope, "list", paramsOrPage] as const;
      }
      const page = typeof paramsOrPage === "number" ? paramsOrPage : 1;
      return [...QUERY_KEYS.ORDERS.ALL, scope, "list", { page, limit }] as const;
    },
    DETAIL: (orderId: string, userId?: string | null) =>
      [...QUERY_KEYS.ORDERS.ALL, userId || "anonymous", "detail", orderId] as const,
    TRACKING: (orderId: string, userId?: string | null) =>
      ["tracking", "orders", userId || "anonymous", orderId, "events"] as const,
  },
  USER: {
    ALL: ["user"] as const,
    PROFILE: (userId?: string | null) => [...QUERY_KEYS.USER.ALL, userId || "guest", "profile"] as const,
    ADDRESSES: (userId?: string | null) => [...QUERY_KEYS.USER.ALL, userId || "guest", "addresses"] as const,
  },
  AUTH: {
    ALL: ["auth"] as const,
    SESSION: (userId?: string | null) => [...QUERY_KEYS.AUTH.ALL, userId || "guest", "session"] as const,
    SESSIONS: (userId?: string | null) => [...QUERY_KEYS.AUTH.ALL, userId || "guest", "device-sessions"] as const,
  },
  COUPONS: {
    ALL: ["coupons"] as const,
    LIST: (params?: Record<string, unknown>) => [...QUERY_KEYS.COUPONS.ALL, "list", params] as const,
    ELIGIBILITY: (couponId: string, userId?: string | null) =>
      [...QUERY_KEYS.COUPONS.ALL, userId || "guest", "eligibility", couponId] as const,
    USAGES: (userId?: string | null, params?: Record<string, unknown>) =>
      [...QUERY_KEYS.COUPONS.ALL, userId || "guest", "usages", params] as const,
  },
  PAYMENTS: {
    ALL: ["payments"] as const,
    LIST: (userId?: string | null) => [...QUERY_KEYS.PAYMENTS.ALL, userId || "guest", "list"] as const,
    DETAIL: (paymentId: string) => [...QUERY_KEYS.PAYMENTS.ALL, "detail", paymentId] as const,
  },
  WISHLISTS: {
    ALL: ["wishlists"] as const,
    CUSTOMER: (userId?: string | null, params?: Record<string, unknown>) =>
      [...QUERY_KEYS.WISHLISTS.ALL, userId || "guest", "customer", params] as const,
    IDS: (userId?: string | null) => [...QUERY_KEYS.WISHLISTS.ALL, userId || "guest", "ids"] as const,
    MY: (userId?: string | null) => [...QUERY_KEYS.WISHLISTS.ALL, userId || "guest", "my"] as const,
    DEFAULT: (userId?: string | null) => [...QUERY_KEYS.WISHLISTS.ALL, userId || "guest", "default"] as const,
    DETAIL: (id: string, userId?: string | null) =>
      [...QUERY_KEYS.WISHLISTS.ALL, userId || "guest", "detail", id] as const,
    PUBLIC: (token: string) => [...QUERY_KEYS.WISHLISTS.ALL, "public", token] as const,
  },
  REVIEWS: {
    ALL: ["reviews"] as const,
    PRODUCT: (productId: string) => [...QUERY_KEYS.REVIEWS.ALL, "product", productId] as const,
    MY: (userId?: string | null) => [...QUERY_KEYS.REVIEWS.ALL, userId || "guest", "my"] as const,
  },
  CMS: {
    ALL: ["cms"] as const,
    BANNERS: (filters?: Record<string, unknown>) => [...QUERY_KEYS.CMS.ALL, "banners", filters] as const,
  },
  STORES: {
    ALL: ["stores"] as const,
    DETAIL: (storeId: string) => [...QUERY_KEYS.STORES.ALL, "detail", storeId] as const,
  },
} as const;
