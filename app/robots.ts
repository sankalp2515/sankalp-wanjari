import type { MetadataRoute } from "next";
import { social } from "@/config/portfolio";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${social.website}/sitemap.xml`,
  };
}
