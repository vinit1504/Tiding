import React from "react";
import { JsonLd } from "./json-ld";
import { SITE_CONFIG } from "@/lib/constants/site-config";

export function WebsiteJsonLd() {
  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    alternateName: "Tiding Quick Commerce",
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_CONFIG.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const localBusinessData = {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    name: SITE_CONFIG.name,
    image: SITE_CONFIG.logoUrl,
    url: SITE_CONFIG.url,
    telephone: SITE_CONFIG.supportPhone,
    priceRange: "₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Sector 1, HSR Layout",
      addressLocality: "Bengaluru",
      addressRegion: "Karnataka",
      postalCode: "560102",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 12.9121,
      longitude: 77.6446,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "06:00",
        closes: "23:30",
      },
    ],
  };

  return (
    <>
      <JsonLd data={websiteData} />
      <JsonLd data={localBusinessData} />
    </>
  );
}
