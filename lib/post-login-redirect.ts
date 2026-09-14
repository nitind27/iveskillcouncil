import { canRoleAccessPath } from "./role-menu-config";
import {
  canAccessFranchiseAdminPath,
  franchiseAppHref,
  franchiseDashboardPath,
  isFranchiseAdminPath,
  shouldPrefixFranchiseApp,
  stripFranchiseAppPrefix,
} from "./franchise-path";

const BLOCKED_REDIRECTS = ["/403", "/401", "/400", "/500", "/503", "/login"];

const ADMIN_APP_PREFIXES = [
  "/dashboard",
  "/students",
  "/fees",
  "/attendance",
  "/staff",
  "/certificates",
  "/reports",
  "/announcements",
  "/chat",
  "/profile",
  "/account",
  "/my-course",
  "/my-fees",
  "/my-exams",
  "/assigned-students",
  "/certificate",
  "/exams",
];

function isAdminAppPath(path: string): boolean {
  const p = (path || "").replace(/\/$/, "") || "/";
  return ADMIN_APP_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

/** Default home after login for each role */
export function getDefaultHomeForRole(roleId: number, franchiseSlug?: string | null): string {
  if (shouldPrefixFranchiseApp(roleId, franchiseSlug)) {
    return franchiseDashboardPath(franchiseSlug);
  }
  return "/dashboard";
}

/** Decode and sanitize redirect query param (before role is known) */
export function parseLoginRedirectParam(redirectParam: string | null | undefined): string {
  if (!redirectParam) return "/dashboard";

  try {
    let decoded = decodeURIComponent(redirectParam);
    while (decoded.includes("%")) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }

    if (!decoded.startsWith("/") || decoded.startsWith("//")) {
      return "/dashboard";
    }

    if (BLOCKED_REDIRECTS.some((b) => decoded === b || decoded.startsWith(b + "?"))) {
      return "/dashboard";
    }

    if (decoded === "/admin" || decoded.startsWith("/admin/")) {
      return "/dashboard";
    }

    return decoded;
  } catch {
    return "/dashboard";
  }
}

/** Final redirect after login — ensures role can access the target path */
export function resolvePostLoginRedirect(
  requestedPath: string,
  roleId: number,
  franchiseSlug?: string | null
): string {
  const defaultHome = getDefaultHomeForRole(roleId, franchiseSlug);
  const path = parseLoginRedirectParam(requestedPath);

  if (path === "/admin" || path.startsWith("/admin/")) {
    return defaultHome;
  }

  if (isFranchiseAdminPath(path) && !canAccessFranchiseAdminPath(path, roleId, franchiseSlug)) {
    return defaultHome;
  }

  const appPath = isFranchiseAdminPath(path) ? stripFranchiseAppPrefix(path) : path;
  const canAccess = canRoleAccessPath(roleId, appPath) || canRoleAccessPath(roleId, path);

  if (!canAccess) {
    return defaultHome;
  }

  if (shouldPrefixFranchiseApp(roleId, franchiseSlug) && isAdminAppPath(appPath)) {
    return franchiseAppHref(appPath, franchiseSlug);
  }

  return path;
}
