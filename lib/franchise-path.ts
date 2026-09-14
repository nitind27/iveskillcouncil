/**
 * Path-based franchise sites: https://ivesdc.codeatinfotech.com/{slug}
 * Edge-safe (no Prisma) — used by middleware and client shells.
 */

export const RESERVED_FRANCHISE_PATH_SEGMENTS = new Set([
  "login",
  "userpanel",
  "dashboard",
  "admin",
  "franchises",
  "users",
  "students",
  "courses",
  "analytics",
  "subscription",
  "certificates",
  "certificate",
  "payments",
  "attendance",
  "reports",
  "staff",
  "fees",
  "events",
  "blogs",
  "gallery",
  "feedback",
  "settings",
  "my-course",
  "my-fees",
  "my-exams",
  "assigned-students",
  "exams",
  "my-exams",
  "chat",
  "announcements",
  "profile",
  "account",
  "f",
  "api",
  "_next",
  "uploads",
  "favicon.ico",
  "favicon1.ico",
  "401",
  "400",
  "403",
  "404",
  "500",
  "503",
  "exam-link",
  "robots.txt",
  "sitemap.xml",
  "manifest.json",
  "sw.js",
  "static",
  "public",
  "assets",
  "images",
  "css",
  "js",
  "fonts",
  "logo",
  "owner",
  "cert",
  "border",
  "health",
  "status",
  "www",
  "mail",
]);

export function sanitizeFranchiseSlug(input: string): string {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 80);
}

export function isReservedPathSegment(segment: string): boolean {
  return RESERVED_FRANCHISE_PATH_SEGMENTS.has(String(segment || "").toLowerCase());
}

export function franchisePortalPath(slug: string): string {
  const safe = sanitizeFranchiseSlug(slug);
  return safe ? `/${safe}` : "/";
}

export function franchisePortalUrl(slug: string, origin?: string): string {
  const path = franchisePortalPath(slug);
  const base = (origin || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}

/** First URL segment if this request should be treated as a franchise site. */
export function getFranchisePathSlug(pathname: string): string | null {
  if (!pathname || pathname === "/") return null;
  if (pathname === "/f" || pathname === "/f/") return null;
  if (pathname.startsWith("/f/")) {
    const slug = pathname.split("/").filter(Boolean)[1];
    if (!slug || isReservedPathSegment(slug)) return null;
    return slug.toLowerCase();
  }
  const first = pathname.split("/").filter(Boolean)[0];
  if (!first || isReservedPathSegment(first)) return null;
  return first.toLowerCase();
}

export function isFranchiseSitePath(pathname: string): boolean {
  return getFranchisePathSlug(pathname) != null;
}

export function validateFranchiseSlugInput(input: string): { valid: true; slug: string } | { valid: false; error: string } {
  const slug = sanitizeFranchiseSlug(input);
  if (!slug) {
    return { valid: false, error: "Portal URL name is required (letters and numbers only, no dashes)." };
  }
  if (slug.length < 2) {
    return { valid: false, error: "Portal URL name must be at least 2 characters." };
  }
  if (isReservedPathSegment(slug)) {
    return { valid: false, error: `"${slug}" is reserved. Choose a different portal name.` };
  }
  if (!/^[a-z0-9]+$/.test(slug)) {
    return { valid: false, error: "Use lowercase letters and numbers only (no dashes or spaces)." };
  }
  return { valid: true, slug };
}

/** Public pages under /{slug}/... that stay on the userpanel UI. */
export const FRANCHISE_PUBLIC_NESTED_SEGMENTS = new Set([
  "courses",
  "franchises",
  "franchise",
  "franchise-plans",
  "franchise-payment",
  "apply-franchise",
  "booking",
]);

/** Second path segment under a franchise slug (e.g. dashboard in /{slug}/dashboard). */
export function getFranchiseNestedFirstSegment(pathname: string): string | null {
  if (!getFranchisePathSlug(pathname)) return null;
  const rest = pathname.split("/").filter(Boolean)[1];
  return rest ? rest.toLowerCase() : null;
}

/** True for /{slug}/dashboard, /{slug}/students, etc. — same admin UI, franchise URL. */
export function isFranchiseAdminPath(pathname: string): boolean {
  const first = getFranchiseNestedFirstSegment(pathname);
  if (!first) return false;
  if (FRANCHISE_PUBLIC_NESTED_SEGMENTS.has(first)) return false;
  return isReservedPathSegment(first);
}

export function isFranchisePublicSitePath(pathname: string): boolean {
  return getFranchisePathSlug(pathname) != null && !isFranchiseAdminPath(pathname);
}

/** /{slug}/dashboard → /dashboard */
export function stripFranchiseAppPrefix(pathname: string): string {
  if (!isFranchiseAdminPath(pathname)) {
    const normalized = (pathname || "").replace(/\/$/, "") || "/";
    return normalized;
  }
  const rest = pathname.split("/").filter(Boolean).slice(1).join("/");
  return rest ? `/${rest}` : "/";
}

/** Prefix an admin href with /{slug} (no UI change — URL only). */
export function franchiseAppHref(href: string, slug?: string | null): string {
  const safe = slug ? sanitizeFranchiseSlug(slug) : "";
  if (!safe || !href) return href;
  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#")
  ) {
    return href;
  }
  if (href === `/${safe}` || href.startsWith(`/${safe}/`)) return href;
  if (!href.startsWith("/")) return href;
  return `/${safe}${href}`;
}

export function franchiseDashboardPath(slug?: string | null): string {
  const safe = slug ? sanitizeFranchiseSlug(slug) : "";
  return safe ? `/${safe}/dashboard` : "/dashboard";
}

/** Franchise staff/students use /{slug}/dashboard; institute admins stay on /dashboard. */
export function shouldPrefixFranchiseApp(roleId: number, slug?: string | null): boolean {
  const safe = slug ? sanitizeFranchiseSlug(slug) : "";
  if (!safe) return false;
  const id = Number(roleId);
  return id === 3 || id === 4 || id === 5;
}

/**
 * Only that franchise's own users may open /{slug}/dashboard.
 * Institute Admin / Super Admin must use /dashboard — this URL is 404 for them.
 */
export function canAccessFranchiseAdminPath(
  pathname: string,
  roleId: number,
  userSlug?: string | null
): boolean {
  if (!isFranchiseAdminPath(pathname)) return true;
  const urlSlug = (getFranchisePathSlug(pathname) || "").replace(/-/g, "");
  const own = sanitizeFranchiseSlug(userSlug || "");
  if (!urlSlug || !own) return false;
  if (!shouldPrefixFranchiseApp(roleId, own)) return false;
  return own === urlSlug;
}

/** Map /userpanel/... links onto the current site base (main panel or /{franchise}). */
export function userPanelHref(href: string, basePath = "/userpanel"): string {
  if (!href) return `${basePath}/courses`;
  if (href === "#home" || href === "/" || href === "") return basePath;
  if (href === "#courses") return `${basePath}/courses`;
  if (href.startsWith("#")) return `${basePath}${href}`;
  if (href.startsWith("/userpanel")) {
    const rest = href.slice("/userpanel".length);
    if (!rest || rest === "/") return basePath;
    if (rest.startsWith("#")) return `${basePath}${rest}`;
    return `${basePath}${rest}`;
  }
  return href;
}
