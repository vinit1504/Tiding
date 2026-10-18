export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  image_public_id?: string;
  icon?: string;
  icon_url?: string;
  icon_public_id?: string;
  display_order?: number;
  is_active?: boolean;
  itemCount?: number;
  subcategories?: CatalogSubcategory[];
}

export interface CatalogSubcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  image_public_id?: string;
  display_order?: number;
  is_active?: boolean;
  is_double_row?: boolean;
  itemCount?: number;
}

export interface CatalogBrand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  logo_url?: string;
  is_active?: boolean;
}

export interface ProductImageItem {
  id?: string;
  image_url: string;
  image_public_id?: string;
  alt_text?: string;
  is_primary?: boolean;
  display_order?: number;
}

export interface ProductVariantItem {
  id: string;
  product_id?: string;
  sku: string;
  barcode?: string;
  variant_name: string;
  slug?: string;
  mrp: number;
  selling_price: number;
  cost_price?: number;
  weight_in_grams?: number;
  unit?: string;
  is_default?: boolean;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  image_url?: string;
  stock_quantity?: number;
  is_available?: boolean;
}

export interface CatalogProduct {
  id: string;
  subcategory_id: string;
  subcategory_name?: string;
  category_id?: string;
  category_name?: string;
  category_slug?: string;
  brand_id?: string;
  brand?: CatalogBrand | string;
  name: string;
  slug: string;
  description?: string;
  product_type?: "PACKAGED" | "FRESH" | "LOOSE";
  food_preference?: "VEG" | "NON_VEG" | "VEGAN" | "EGG";
  tags?: string[];
  images?: ProductImageItem[];
  image_url: string;
  variants?: ProductVariantItem[];
  is_active?: boolean;
  // Normalized consumer fields for UI
  price: number;
  mrp: number;
  discountPercentage?: number;
  unit: string;
  stock: number;
  isAvailable: boolean;
  deliveryEtaMinutes?: number;
  rating?: number;
  ratingCount?: number;
}

export interface StoreInventoryItem {
  id?: string;
  store_id: string;
  product_variant_id: string;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StoreInventoryResponse {
  store_id: string;
  inventory: StoreInventoryItem[];
  page?: number;
  limit?: number;
  total?: number;
}
