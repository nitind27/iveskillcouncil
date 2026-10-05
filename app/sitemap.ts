import type { MetadataRoute } from "next";
import { getRequestSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getRequestSiteUrl();
  const lastModified = new Date();
  return [
    { url: `${siteUrl}/userpanel`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/userpanel/courses`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/userpanel/franchises`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/userpanel/franchise-plans`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/certificate`, lastModified, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/verify`, lastModified, changeFrequency: "monthly", priority: 0.4 },
  ];
}
