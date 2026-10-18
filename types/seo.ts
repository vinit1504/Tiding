export interface SeoMetadataProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export interface JsonLdProductProps {
  name: string;
  description: string;
  image: string;
  sku: string;
  price: number;
  mrp: number;
  currency?: string;
  inStock: boolean;
  rating?: number;
  reviewCount?: number;
  brand?: string;
  category?: string;
  url: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}
