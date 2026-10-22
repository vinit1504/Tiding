export const SITE_CONFIG = {
  name: "Tiding",
  tagline: "Instant Grocery & Essentials Delivery",
  description:
    "Order farm-fresh vegetables, organic fruits, daily dairy essentials, bakery, snacks, and household staples delivered to your doorstep with express delivery.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://tiding.com",
  logoUrl:
    process.env.NEXT_PUBLIC_LOGO_URL ||
    "https://res.cloudinary.com/dktxfhq00/image/upload/e_trim/v1790058895/tiding/avatars/xub5yhdvvd46adh8uoiv.png",
  loginVideoUrl:
    process.env.NEXT_PUBLIC_LOGIN_VIDEO_URL ||
    "https://res.cloudinary.com/dktxfhq00/video/upload/v1788521432/so_incres_the_speed_in_video_a_xhk7mx.mp4",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  currencySymbol: "₹",
  freeDeliveryThreshold: 199,
  defaultDeliveryFee: 25,
  handlingFee: 2,
  supportPhone: "+91 98765 43210",
  supportEmail: "support@tiding.com",
  operatingHours: "6:00 AM - 11:30 PM",
  keywords: [
    "online grocery delivery",
    "instant grocery",
    "fresh vegetables online",
    "organic fruits delivery",
    "milk and dairy delivery",
    "quick commerce India",
    "express delivery",
    "Tiding groceries",
  ],
};
