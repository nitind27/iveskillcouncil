import type { Metadata } from "next";
import { franchisesMetadata } from "@/lib/seo";
import { loadSeoConfig } from "@/lib/seo-server";
import { getRequestSiteUrl } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await loadSeoConfig();
  return franchisesMetadata(getRequestSiteUrl(), seo);
}

export default function FranchisesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
