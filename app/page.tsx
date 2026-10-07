import type { Metadata } from "next";
import UserDashboard from "@/components/userpanel/UsertDashboard";
import UserPanelClientLayout from "@/components/userpanel/UserPanelClientLayout";
import { homeMetadata, organizationJsonLd, jsonLdScript } from "@/lib/seo";
import { loadSeoConfig } from "@/lib/seo-server";
import { getRequestSiteUrl } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await loadSeoConfig();
  return homeMetadata(getRequestSiteUrl(), seo);
}

export default async function HomePage() {
  const seo = await loadSeoConfig();
  const siteUrl = getRequestSiteUrl();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationJsonLd(siteUrl, seo)) }}
      />
      <UserPanelClientLayout>
        <UserDashboard />
      </UserPanelClientLayout>
    </>
  );
}
