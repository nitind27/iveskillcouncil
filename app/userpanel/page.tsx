import type { Metadata } from "next";
import UserDashboard from "@/components/userpanel/UsertDashboard";
import { homeMetadata } from "@/lib/seo";
import { loadSeoConfig } from "@/lib/seo-server";
import { getRequestSiteUrl } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await loadSeoConfig();
  return homeMetadata(getRequestSiteUrl(), seo);
}

export default function UserPanelHomePage() {
  return (
    <div>
      <UserDashboard />
    </div>
  );
}
