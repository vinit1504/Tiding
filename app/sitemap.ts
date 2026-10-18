import { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/constants/site-config";
import { catalogService } from "@/lib/api/catalog-service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_CONFIG.url;
  const lastModified = new Date();

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/search`, lastModified, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/checkout`, lastModified, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/delivery-areas`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/faq`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy-policy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Real categories from API
  const categories = await catalogService.getCategories({ limit: 50 });
  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((c) => c.slug !== "all")
    .map((category) => ({
      url: `${baseUrl}/category/${category.slug}`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    }));

  // Real products from API
  const products = await catalogService.getProducts({ limit: 100 });
  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/product/${product.slug}`,
    lastModified,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
