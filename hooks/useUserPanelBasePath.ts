"use client";

import { usePathname } from "next/navigation";
import { getFranchisePathSlug, userPanelHref } from "@/lib/franchise-path";

export function useUserPanelBasePath(): string {
  const pathname = usePathname() || "";
  const slug = getFranchisePathSlug(pathname);
  return slug ? `/${slug.replace(/-/g, "")}` : "/userpanel";
}

export function useUserPanelHref() {
  const basePath = useUserPanelBasePath();
  return (href: string) => userPanelHref(href, basePath);
}

export function useFranchiseSiteSlug(): string | null {
  const pathname = usePathname() || "";
  const slug = getFranchisePathSlug(pathname);
  return slug ? slug.replace(/-/g, "") : null;
}
