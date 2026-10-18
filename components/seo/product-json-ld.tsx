import React from "react";
import { JsonLd } from "./json-ld";
import { Product } from "@/types/product";
import { SITE_CONFIG } from "@/lib/constants/site-config";

export function ProductJsonLd({ product }: { product: Product }) {
  const productData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image_url,
    description: product.description,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: product.brand || SITE_CONFIG.name,
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_CONFIG.url}/product/${product.slug}`,
      priceCurrency: "INR",
      price: product.price,
      priceValidUntil: "2027-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability: product.isAvailable && product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: SITE_CONFIG.name,
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.ratingCount,
    },
  };

  return <JsonLd data={productData} />;
}
