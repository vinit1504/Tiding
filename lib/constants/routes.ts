export const ROUTES = {
  HOME: "/",
  OFFERS: "/offers",
  ORDERS: "/orders",
  PROFILE: "/profile",
  ADDRESSES: "/addresses",
  WALLET: "/wallet",
  CONTACT: "/contact",
  PRIVACY: "/privacy-policy",
  CATEGORY: (slug: string) => `/category/${slug}`,
  PRODUCT: (slug: string) => `/product/${slug}`,
} as const;
