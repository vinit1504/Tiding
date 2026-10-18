import { apiClient } from "./api-client";
import {
  CatalogCategory,
  CatalogSubcategory,
  CatalogBrand,
  CatalogProduct,
} from "@/types/catalog";

export interface GetCategoriesParams {
  page?: number;
  limit?: number;
  is_active?: boolean;
}

export interface GetSubcategoriesParams {
  category_id?: string;
  is_double_row?: boolean;
  page?: number;
  limit?: number;
}

export interface GetBrandsParams {
  page?: number;
  limit?: number;
}

export interface GetCatalogProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  food_preference?: string;
  category_id?: string;
  categoryId?: string;
  subcategory_id?: string;
  subcategoryId?: string;
  brand_id?: string;
  brandId?: string;
  store_id?: string;
  storeId?: string;
  area_id?: string;
  in_stock_only?: boolean;
}

export function isUuid(val?: string | null): boolean {
  if (!val || typeof val !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

// Normalizer for converting raw backend product to clean CatalogProduct
export function normalizeProduct(item: any): CatalogProduct {
  const defVariant = item.default_variant || (Array.isArray(item.variants) && item.variants[0]) || null;
  const sellingPrice = Number(
    defVariant?.selling_price ?? item.selling_price ?? item.price ?? 0
  );
  const mrp = Number(
    defVariant?.mrp ?? item.mrp ?? sellingPrice
  );
  const discountPercentage =
    mrp > sellingPrice
      ? Math.round(((mrp - sellingPrice) / mrp) * 100)
      : Number(item.discountPercentage || 0);
  const unit =
    defVariant?.variant_name ||
    defVariant?.unit ||
    item.unit ||
    "1 pack";
  const stock = Number(
    defVariant?.stock_quantity ?? item.stock_quantity ?? item.stock ?? 10
  );
  const isAvailable =
    defVariant?.is_in_stock ?? defVariant?.is_available ?? item.is_available ?? item.isAvailable ?? true;
  const imageUrl =
    (Array.isArray(item.images) && (item.images.find((img: any) => img.is_primary)?.image_url || item.images[0]?.image_url)) ||
    item.image_url ||
    defVariant?.image_url ||
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80";

  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    brand: item.brand_name || (typeof item.brand === "string" ? item.brand : item.brand?.name) || "Tiding",
    subcategory_id: item.subcategoryId || item.subcategory_id || item.subcategory?.id || "",
    subcategory_name: item.subcategory_name || item.subcategory?.name || "",
    category_id: item.categoryId || item.category_id || item.category?.id || "",
    category_name: item.category_name || item.category?.name || "",
    category_slug: item.category_slug || item.category?.slug || "",
    description: item.description || "",
    image_url: imageUrl,
    price: Number.isFinite(sellingPrice) ? sellingPrice : 0,
    mrp: Number.isFinite(mrp) ? mrp : sellingPrice,
    discountPercentage,
    unit,
    stock,
    isAvailable,
    deliveryEtaMinutes: item.deliveryEtaMinutes || 8,
    rating: item.rating || 4.8,
    ratingCount: item.ratingCount || 120,
    variants: item.variants?.map((v: any) => ({
      id: v.id,
      sku: v.sku,
      variant_name: v.variant_name || v.unit || unit,
      mrp: Number(v.mrp || mrp),
      selling_price: Number(v.selling_price || sellingPrice),
      unit: v.unit || v.variant_name || unit,
      stock_quantity: Number(v.stock_quantity ?? stock),
      is_available: v.is_available ?? isAvailable,
    })),
  };
}

class CatalogService {
  /**
   * Fetch all active root categories from backend API
   * GET /api/v1/catalog/categories
   */
  async getCategories(params?: GetCategoriesParams): Promise<CatalogCategory[]> {
    const searchParams = new URLSearchParams();
    searchParams.append("page", String(params?.page || 1));
    searchParams.append("limit", String(params?.limit || 50));
    searchParams.append("is_active", String(params?.is_active ?? true));

    try {
      const res = await apiClient.get<CatalogCategory[]>(
        `/catalog/categories?${searchParams.toString()}`
      );
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  }

  /**
   * Fetch category by ID or slug from backend API
   * GET /api/v1/catalog/categories/:id
   */
  async getCategoryById(id: string): Promise<CatalogCategory | null> {
    try {
      if (isUuid(id)) {
        return await apiClient.get<CatalogCategory>(`/catalog/categories/${id}`);
      }
      const all = await this.getCategories();
      return all.find((c) => c.slug === id || c.id === id) || null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch paginated subcategories by category ID from backend API
   * GET /api/v1/catalog/subcategories?category_id=...&page=...&limit=20
   */
  async getSubcategoriesPaginated(
    params: GetSubcategoriesParams
  ): Promise<{
    data: CatalogSubcategory[];
    meta?: {
      pagination?: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params.category_id && isUuid(params.category_id)) {
      searchParams.append("category_id", params.category_id);
    }
    if (params.is_double_row !== undefined) {
      searchParams.append("is_double_row", String(params.is_double_row));
    }
    searchParams.append("page", String(params.page || 1));
    searchParams.append("limit", String(params.limit || 20));

    try {
      const res = await apiClient.getWithMeta<CatalogSubcategory[]>(
        `/catalog/subcategories?${searchParams.toString()}`
      );
      return {
        data: Array.isArray(res.data) ? res.data : [],
        meta: res.meta,
      };
    } catch {
      return { data: [] };
    }
  }

  /**
   * Fetch subcategories by category ID from backend API
   * GET /api/v1/catalog/subcategories?category_id=...
   */
  async getSubcategories(params: GetSubcategoriesParams): Promise<CatalogSubcategory[]> {
    const res = await this.getSubcategoriesPaginated(params);
    return res.data;
  }

  /**
   * Fetch subcategory by ID from backend API
   * GET /api/v1/catalog/subcategories/:id
   */
  async getSubcategoryById(id: string): Promise<CatalogSubcategory | null> {
    try {
      return await apiClient.get<CatalogSubcategory>(`/catalog/subcategories/${id}`);
    } catch {
      return null;
    }
  }

  /**
   * Fetch brands from backend API
   * GET /api/v1/catalog/brands
   */
  async getBrands(params?: GetBrandsParams): Promise<CatalogBrand[]> {
    const searchParams = new URLSearchParams();
    searchParams.append("page", String(params?.page || 1));
    searchParams.append("limit", String(params?.limit || 50));

    try {
      const res = await apiClient.get<CatalogBrand[]>(
        `/catalog/brands?${searchParams.toString()}`
      );
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  }

  /**
   * Fetch products by category, subcategory, brand and store inventory from backend API
   * GET /api/v1/catalog/products
   */
  async getProducts(params?: GetCatalogProductsParams): Promise<CatalogProduct[]> {
    const query = new URLSearchParams();
    query.append("page", String(params?.page || 1));
    query.append("limit", String(params?.limit || 20));
    if (params?.search) query.append("search", params.search);
    if (params?.food_preference) query.append("food_preference", params.food_preference);
    
    // Support categoryId matching backend curl
    const catId = params?.categoryId || params?.category_id;
    if (catId && isUuid(catId)) {
      query.append("categoryId", catId);
    }
    // Support subcategoryId matching backend curl
    const subCatId = params?.subcategoryId || params?.subcategory_id;
    if (subCatId && isUuid(subCatId)) {
      query.append("subcategoryId", subCatId);
    }
    // Support brandId matching backend curl
    const brId = params?.brandId || params?.brand_id;
    if (brId && isUuid(brId)) {
      query.append("brandId", brId);
    }
    // Support storeId matching backend curl
    const stId = params?.storeId || params?.store_id;
    if (stId && isUuid(stId)) {
      query.append("storeId", stId);
    }
    if (params?.area_id && isUuid(params.area_id)) {
      query.append("area_id", params.area_id);
    }
    if (params?.in_stock_only) query.append("in_stock_only", "true");

    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (stId && isUuid(stId)) headers["x-store-id"] = stId;
    if (params?.area_id && isUuid(params.area_id)) headers["x-area-id"] = params.area_id;

    try {
      const rawResult = await apiClient.get<any[]>(
        `/catalog/products?${query.toString()}`,
        { headers }
      );

      if (Array.isArray(rawResult)) {
        return rawResult.map(normalizeProduct);
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Fetch single product by ID or slug directly from backend API
   * GET /api/v1/catalog/products/:id
   */
  async getProductByIdOrSlug(idOrSlug: string): Promise<CatalogProduct | null> {
    if (!idOrSlug) return null;

    try {
      if (isUuid(idOrSlug)) {
        const raw = await apiClient.get<any>(`/catalog/products/${idOrSlug}`);
        return raw ? normalizeProduct(raw) : null;
      }

      // Search by slug/query in catalog products API
      const searchRes = await apiClient.get<any[]>(
        `/catalog/products?search=${encodeURIComponent(idOrSlug)}&limit=20`
      );
      if (Array.isArray(searchRes)) {
        const match = searchRes.find((p) => p.slug === idOrSlug || p.id === idOrSlug);
        if (match) return normalizeProduct(match);
      }

      // Fallback search across all products
      const all = await this.getProducts({ limit: 100 });
      return all.find((p) => p.slug === idOrSlug || p.id === idOrSlug) || null;
    } catch {
      return null;
    }
  }
}

export const catalogService = new CatalogService();
