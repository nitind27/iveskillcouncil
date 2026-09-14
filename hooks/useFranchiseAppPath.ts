"use client";

import { useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  franchiseAppHref,
  franchiseDashboardPath,
  sanitizeFranchiseSlug,
  shouldPrefixFranchiseApp,
  stripFranchiseAppPrefix,
} from "@/lib/franchise-path";

export function useFranchiseAppSlug(): string | null {
  const { user } = useAuth();
  if (!user) return null;
  const fromUser = user.franchise?.slug ? sanitizeFranchiseSlug(user.franchise.slug) : "";
  if (!shouldPrefixFranchiseApp(user.roleId, fromUser)) return null;
  return fromUser;
}

export function useFranchiseAppHref() {
  const slug = useFranchiseAppSlug();
  return useCallback((href: string) => franchiseAppHref(href, slug), [slug]);
}

export function useFranchiseDashboardPath() {
  const slug = useFranchiseAppSlug();
  return useMemo(() => franchiseDashboardPath(slug), [slug]);
}

export function useStrippedAppPath() {
  const pathname = usePathname() || "";
  return stripFranchiseAppPrefix(pathname);
}
