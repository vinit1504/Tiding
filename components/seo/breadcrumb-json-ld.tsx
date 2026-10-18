import React from "react";
import { JsonLd } from "./json-ld";
import { BreadcrumbItem } from "@/types/seo";
import { SITE_CONFIG } from "@/lib/constants/site-config";

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_CONFIG.url}${item.url}`,
    })),
  };

  return <JsonLd data={breadcrumbData} />;
}
