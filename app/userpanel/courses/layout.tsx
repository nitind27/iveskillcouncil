import type { Metadata } from "next";
import { coursesMetadata } from "@/lib/seo";
import { loadSeoConfig } from "@/lib/seo-server";
import { getRequestSiteUrl } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await loadSeoConfig();
  return coursesMetadata(getRequestSiteUrl(), seo);
}

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
