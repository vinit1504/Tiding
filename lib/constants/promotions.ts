export interface PromoBanner {
  id: string;
  title: string;
  headline: string;
  subtext: string;
  cta: string;
  categorySlug: string;
  badge: string;
  bgGradient: string;
  accentColor: string;
  image: string;
}

export const PROMOTIONAL_BANNERS: PromoBanner[] = [
  {
    id: "banner-1",
    title: "Morning Farm Harvest",
    headline: "Fresh Veggies & Fruits Up To 35% Off",
    subtext: "Farm-fresh goodness & exotic produce delivered to your door with express delivery.",
    cta: "Shop Now",
    categorySlug: "vegetables-fruits",
    badge: "⚡ Express",
    bgGradient: "from-[#087838] via-[#0E8A40] to-[#18A818]",
    accentColor: "#FFFFFF",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80",
  },
  {
    id: "banner-2",
    title: "Daily Dairy & Bakery",
    headline: "Fresh Milk, Farm Eggs & Breads",
    subtext: "Pasteurised milk, fresh paneer & whole wheat bakery staples.",
    cta: "Shop Breakfast",
    categorySlug: "dairy-bread-eggs",
    badge: "Daily Staples",
    bgGradient: "from-[#3730A3] via-[#4F46E5] to-[#818CF8]",
    accentColor: "#FFFFFF",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80",
  },
  {
    id: "banner-3",
    title: "Pet Care Supplies",
    headline: "Pet care supplies at your door",
    subtext: "Nutritious pet food, tasty treats, grooming & playful toys.",
    cta: "Order Now",
    categorySlug: "pet-care",
    badge: "Paws & Care",
    bgGradient: "from-[#C2410C] via-[#EA580C] to-[#F59E0B]",
    accentColor: "#FFFFFF",
    image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&q=80",
  },
  {
    id: "banner-4",
    title: "Baby Care Essentials",
    headline: "No time for a diaper run?",
    subtext: "Diapers, gentle wet wipes & baby food delivered fast to your doorstep.",
    cta: "Order Now",
    categorySlug: "baby-care",
    badge: "Baby Essentials",
    bgGradient: "from-[#1D4ED8] via-[#2563EB] to-[#60A5FA]",
    accentColor: "#FFFFFF",
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80",
  },
  {
    id: "banner-5",
    title: "Snacks & Munchies",
    headline: "Movie Night Cravings?",
    subtext: "Crispy potato chips, namkeens, dips & roasted nuts delivered fast.",
    cta: "Shop Munchies",
    categorySlug: "snacks-munchies",
    badge: "Quick Cravings",
    bgGradient: "from-[#B45309] via-[#D97706] to-[#F59E0B]",
    accentColor: "#FFFFFF",
    image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&q=80",
  },
  {
    id: "banner-6",
    title: "Cold Drinks & Juices",
    headline: "Chilled Sodas & Fresh Juices",
    subtext: "Instant refreshment delivered chilled to your doorstep.",
    cta: "Explore Drinks",
    categorySlug: "cold-drinks-juices",
    badge: "Ice Cold",
    bgGradient: "from-[#0F766E] via-[#0D9488] to-[#14B8A6]",
    accentColor: "#FFFFFF",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80",
  },
];
