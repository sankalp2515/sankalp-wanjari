import type { MetadataRoute } from "next";
import { social, projects } from "@/config/portfolio";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: social.website,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    ...["/reliability", "/reliability/intent-bound-controls", ...projects.map(project => `/work/${project.shortName}`)].map(path => ({
      url: `${social.website.replace(/\/$/, "")}${path}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
