import type { Metadata } from "next";
import UserPanelClientLayout from "@/components/userpanel/UserPanelClientLayout";
import { organizationJsonLd, jsonLdScript, brandMetadata } from "@/lib/seo";
import { loadSeoConfig } from "@/lib/seo-server";
import { getRequestSiteUrl } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await loadSeoConfig();
  return brandMetadata(getRequestSiteUrl(), seo);
}

export default async function UserPanelLayout({ children }: { children: React.ReactNode }) {
  const seo = await loadSeoConfig();
  const jsonLd = organizationJsonLd(getRequestSiteUrl(), seo);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <UserPanelClientLayout>{children}</UserPanelClientLayout>
    </>
  );
}
