export * from "./cart";
export * from "./catalog";
export * from "./location";
export * from "./order";
export * from "./product";
export * from "./seo";
export * from "./user";
export * from "./coupon";

// Common shared API response & pagination types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface QueryFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: unknown;
}
