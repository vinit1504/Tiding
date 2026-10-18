export interface ProductVariant {
  id: string;
  sku: string;
  unit: string; // e.g. "500 g", "1 kg", "Pack of 2"
  price: number;
  mrp: number;
  discountPercentage?: number;
  stock: number;
  isAvailable: boolean;
  image_url?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  description: string;
  image_url: string;
  images?: string[];
  category_id: string;
  category_name: string;
  category_slug: string;
  subcategory_id?: string;
  subcategory_name?: string;
  price: number;
  mrp: number;
  discountPercentage: number;
  unit: string;
  stock: number;
  isAvailable: boolean;
  isOrganic?: boolean;
  deliveryEtaMinutes: number;
  rating: number;
  ratingCount: number;
  variants?: ProductVariant[];
  badge?: string; // e.g. "Bestseller", "20% OFF", "Organic"
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image_url?: string;
  itemCount?: number;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  itemCount?: number;
}
