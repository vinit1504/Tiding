export interface ProductVariant {
  id: string;
  sku?: string;
  name?: string;
  variant_name?: string;
  unit: string; // e.g. "500 g", "1 kg", "Pack of 2"
  price: number;
  selling_price?: number;
  mrp: number;
  discountPercentage?: number;
  stock: number;
  stock_quantity?: number;
  reserved_quantity?: number;
  low_stock_threshold?: number;
  isAvailable: boolean;
  is_in_stock?: boolean;
  is_available?: boolean;
  image_url?: string;
  attributes?: { attribute_name: string; value: string }[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  description: string;
  image_url: string;
  images?: string[] | { id?: string; image_url: string; is_primary?: boolean }[];
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
  stock_quantity?: number;
  isAvailable: boolean;
  is_in_stock?: boolean;
  isOrganic?: boolean;
  deliveryEtaMinutes: number;
  rating: number;
  ratingCount: number;
  variants?: ProductVariant[];
  default_variant?: ProductVariant;
  selected_variant?: ProductVariant;
  badge?: string; // e.g. "Bestseller", "20% OFF", "Organic"
  store_id?: string;
  attributes?: { attribute_name: string; value: string }[];
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
