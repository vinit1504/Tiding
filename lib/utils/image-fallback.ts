export interface CategoryFallbackMeta {
  emoji: string;
  bgColor: string;
  label: string;
}

export function getCategoryFallbackMeta(name: string = "", slug: string = ""): CategoryFallbackMeta {
  const query = `${name} ${slug}`.toLowerCase();

  if (query.includes("pooja") || query.includes("puja") || query.includes("agarbatti") || query.includes("diya")) {
    return { emoji: "🪔", bgColor: "#FFF7ED", label: "Pooja" };
  }
  if (query.includes("veg") || query.includes("sabzi")) {
    return { emoji: "🥦", bgColor: "#EAF5EA", label: "Veggies" };
  }
  if (query.includes("fruit")) {
    return { emoji: "🍎", bgColor: "#FEE2E2", label: "Fruits" };
  }
  if (query.includes("dairy") || query.includes("milk") || query.includes("curd") || query.includes("paneer")) {
    return { emoji: "🥛", bgColor: "#EFF6FF", label: "Dairy" };
  }
  if (query.includes("bakery") || query.includes("bread") || query.includes("bun") || query.includes("pav") || query.includes("cake")) {
    return { emoji: "🍞", bgColor: "#F6F1EA", label: "Bakery" };
  }
  if (query.includes("snack") || query.includes("munch") || query.includes("chips") || query.includes("namkeen") || query.includes("biscuit")) {
    return { emoji: "🍿", bgColor: "#FFF8E6", label: "Snacks" };
  }
  if (query.includes("drink") || query.includes("juice") || query.includes("beverage") || query.includes("soda") || query.includes("cola")) {
    return { emoji: "🥤", bgColor: "#FFF3E8", label: "Drinks" };
  }
  if (query.includes("staple") || query.includes("atta") || query.includes("rice") || query.includes("dal") || query.includes("flour") || query.includes("grain")) {
    return { emoji: "🌾", bgColor: "#EFEFEB", label: "Staples" };
  }
  if (query.includes("masala") || query.includes("oil") || query.includes("spice") || query.includes("ghee")) {
    return { emoji: "🌶️", bgColor: "#FBECE6", label: "Masala & Oil" };
  }
  if (query.includes("sauce") || query.includes("spread") || query.includes("jam") || query.includes("ketchup") || query.includes("honey")) {
    return { emoji: "🍯", bgColor: "#FCEEEE", label: "Sauces" };
  }
  if (query.includes("meat") || query.includes("chicken") || query.includes("fish") || query.includes("mutton") || query.includes("egg")) {
    return { emoji: "🍗", bgColor: "#FCEAE8", label: "Meat & Eggs" };
  }
  if (query.includes("organic") || query.includes("healthy") || query.includes("salad")) {
    return { emoji: "🥗", bgColor: "#EAF5EA", label: "Organic" };
  }
  if (query.includes("baby") || query.includes("infant") || query.includes("diaper")) {
    return { emoji: "🍼", bgColor: "#EBF6FA", label: "Baby Care" };
  }
  if (query.includes("pharma") || query.includes("medic") || query.includes("wellness") || query.includes("health")) {
    return { emoji: "💊", bgColor: "#F8EFF7", label: "Pharma" };
  }
  if (query.includes("clean") || query.includes("detergent") || query.includes("wash") || query.includes("household")) {
    return { emoji: "🧹", bgColor: "#EAF2F8", label: "Cleaning" };
  }
  if (query.includes("home") || query.includes("office") || query.includes("kitchen") || query.includes("stationery")) {
    return { emoji: "🏠", bgColor: "#EFF1F5", label: "Home" };
  }
  if (query.includes("personal") || query.includes("beauty") || query.includes("skin") || query.includes("hair") || query.includes("shampoo")) {
    return { emoji: "🧴", bgColor: "#F7EEF4", label: "Personal Care" };
  }
  if (query.includes("pet") || query.includes("dog") || query.includes("cat")) {
    return { emoji: "🐾", bgColor: "#FBF2E8", label: "Pet Care" };
  }
  if (query.includes("sweet") || query.includes("choc") || query.includes("candy") || query.includes("dessert") || query.includes("ice cream")) {
    return { emoji: "🍫", bgColor: "#FBEAF0", label: "Sweet Tooth" };
  }
  if (query.includes("tea") || query.includes("coffee")) {
    return { emoji: "☕", bgColor: "#F2EBE5", label: "Tea & Coffee" };
  }
  if (query.includes("paan") || query.includes("mouth")) {
    return { emoji: "🍃", bgColor: "#ECFDF5", label: "Paan Corner" };
  }

  return { emoji: "🛍️", bgColor: "#F3F4F6", label: name || "Category" };
}
