import type { MetadataRoute } from "next";
import { social } from "@/config/portfolio";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: social.website,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
