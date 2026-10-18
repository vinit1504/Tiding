import { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/constants/site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tiding - 10-Minute Grocery Delivery",
    short_name: "Tiding",
    description: SITE_CONFIG.description,
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAF7",
    theme_color: "#18A818",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
