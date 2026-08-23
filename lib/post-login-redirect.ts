import { ROLES } from "./permissions";
import { canRoleAccessPath } from "./role-menu-config";

const BLOCKED_REDIRECTS = ["/403", "/401", "/400", "/500", "/503", "/login"];

/** Default home after login for each role */
export function getDefaultHomeForRole(roleId: number): string {
  switch (Number(roleId)) {
    case ROLES.STUDENT:
      return "/dashboard";
    case ROLES.STAFF:
      return "/dashboard";
    case ROLES.SUB_ADMIN:
      return "/dashboard";
    case ROLES.ADMIN:
    case ROLES.SUPER_ADMIN:
    default:
      return "/dashboard";
  }
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
export function resolvePostLoginRedirect(requestedPath: string, roleId: number): string {
  const path = parseLoginRedirectParam(requestedPath);

  if (path === "/admin" || path.startsWith("/admin/")) {
    return getDefaultHomeForRole(roleId);
  }

  if (canRoleAccessPath(roleId, path)) {
    return path;
  }

  return getDefaultHomeForRole(roleId);
}
