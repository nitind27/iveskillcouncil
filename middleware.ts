import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  canAccessFranchiseAdminPath,
  getFranchisePathSlug,
  isFranchiseAdminPath,
  isReservedPathSegment,
  stripFranchiseAppPrefix,
} from "@/lib/franchise-path";

// Routes that are public — no login required (user panel = default for students/visitors)
const PUBLIC_PATHS = [
  "/login",
  "/api/auth",
  "/userpanel",
  "/certificates/templates",
  "/api/certificates/templates",
];
const isPublicPath = (path: string) =>
  path === "/" ||
  path === "/userpanel" ||
  path === "/f" ||
  path.startsWith("/f/") ||
  PUBLIC_PATHS.some((route) => path.startsWith(route)) ||
  (getFranchisePathSlug(path) != null && !isFranchiseAdminPath(path));

// Protected routes — require login
const isProtectedPath = (path: string) =>
  path.startsWith("/dashboard") ||
  path.startsWith("/admin") ||
  path.startsWith("/franchises") ||
  path.startsWith("/users") ||
  path.startsWith("/students") ||
  path.startsWith("/courses") ||
  path.startsWith("/analytics") ||
  path.startsWith("/subscription") ||
  (path.startsWith("/certificates") && !path.startsWith("/certificates/templates")) ||
  path.startsWith("/payments") ||
  path.startsWith("/attendance") ||
  path.startsWith("/reports") ||
  path.startsWith("/staff") ||
  path.startsWith("/fees") ||
  path.startsWith("/events") ||
  path.startsWith("/blogs") ||
  path.startsWith("/gallery") ||
  path.startsWith("/feedback") ||
  path.startsWith("/settings") ||
  path.startsWith("/my-course") ||
  path.startsWith("/my-fees") ||
  path.startsWith("/assigned-students") ||
  path.startsWith("/certificate") ||
  path.startsWith("/exams") ||
  path.startsWith("/announcements") ||
  path.startsWith("/profile") ||
  path.startsWith("/account") ||
  path.startsWith("/chat") ||
  isFranchiseAdminPath(path);

async function getAccessPayload(
  token: string | undefined
): Promise<{ roleId: number; franchiseSlug?: string } | null> {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const roleId = Number(payload.roleId);
    if (!Number.isFinite(roleId)) return null;
    const franchiseSlug =
      typeof payload.franchiseSlug === "string" ? payload.franchiseSlug.replace(/-/g, "").toLowerCase() : undefined;
    return { roleId, franchiseSlug };
  } catch {
    return null;
  }
}

function rewriteToNotFound(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/404";
  return NextResponse.rewrite(url);
}

function redirectToLogin(request: NextRequest, pathname: string, clearCookies = false) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  const response = NextResponse.redirect(loginUrl);
  if (clearCookies) {
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
  }
  return response;
}

/** When access expired but refresh cookie exists — quietly renew via session-continue bridge. */
function continueWithRefresh(request: NextRequest, pathname: string) {
  const continueUrl = new URL("/api/auth/session-continue", request.url);
  const search = request.nextUrl.search || "";
  continueUrl.searchParams.set("redirect", `${pathname}${search}`);
  return NextResponse.redirect(continueUrl);
}

function rewriteToUserpanel(request: NextRequest, slug: string) {
  const compact = slug.replace(/-/g, "");
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  const rest = segments.slice(1).join("/");
  const url = request.nextUrl.clone();
  url.pathname = rest ? `/userpanel/${rest}` : "/userpanel";
  const response = NextResponse.rewrite(url);
  response.headers.set("x-franchise-slug", compact);
  return response;
}

function rewriteToFranchiseAdmin(request: NextRequest, slug: string) {
  const compact = slug.replace(/-/g, "");
  const adminPath = stripFranchiseAppPrefix(request.nextUrl.pathname);
  const url = request.nextUrl.clone();
  url.pathname = adminPath;
  const response = NextResponse.rewrite(url);
  response.headers.set("x-franchise-slug", compact);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/uploads/") ||
    /\.(png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|mp4|webm)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/f/")) {
    const rest = pathname.slice(3);
    const first = (rest.split("/")[0] || "").toLowerCase();
    if (first && !isReservedPathSegment(first)) {
      const compact = first.replace(/-/g, "");
      const after = rest.split("/").filter(Boolean).slice(1).join("/");
      const destPath = after ? `/${compact}/${after}` : `/${compact}`;
      return NextResponse.redirect(new URL(`${destPath}${request.nextUrl.search}`, request.url));
    }
  }

  const firstSegment = pathname.split("/").filter(Boolean)[0];
  if (firstSegment && !isReservedPathSegment(firstSegment)) {
    const compact = firstSegment.toLowerCase().replace(/-/g, "");
    const rest = pathname.split("/").filter(Boolean).slice(1).join("/");
    if (firstSegment !== compact) {
      const destPath = rest ? `/${compact}/${rest}` : `/${compact}`;
      return NextResponse.redirect(new URL(`${destPath}${request.nextUrl.search}`, request.url));
    }
  }

  const franchiseSlug = getFranchisePathSlug(pathname);
  if (franchiseSlug && !pathname.startsWith("/f/")) {
    const compact = franchiseSlug.replace(/-/g, "");
    const nestedFirst = pathname.split("/").filter(Boolean)[1]?.toLowerCase();

    if (nestedFirst === "login") {
      const dest = new URL("/login", request.url);
      dest.searchParams.set("redirect", `/${compact}/dashboard`);
      return NextResponse.redirect(dest);
    }

    if (isFranchiseAdminPath(pathname)) {
      const adminPath = stripFranchiseAppPrefix(pathname);
      const adminIsPublic =
        PUBLIC_PATHS.some((route) => adminPath === route || adminPath.startsWith(`${route}/`) || adminPath.startsWith(route));

      if (!adminIsPublic) {
        const payload = await getAccessPayload(accessToken);
        if (!payload) {
          if (refreshToken) {
            return continueWithRefresh(request, pathname);
          }
          return redirectToLogin(request, pathname, true);
        }

        const allowed = canAccessFranchiseAdminPath(pathname, payload.roleId, payload.franchiseSlug);
        // Old tokens may lack franchiseSlug — franchise roles still pass through; layout confirms slug.
        const maybeFranchiseUser = payload.roleId === 3 || payload.roleId === 4 || payload.roleId === 5;
        if (!allowed && !(maybeFranchiseUser && !payload.franchiseSlug)) {
          return rewriteToNotFound(request);
        }
      }

      return rewriteToFranchiseAdmin(request, compact);
    }

    return rewriteToUserpanel(request, compact);
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (isProtectedPath(pathname)) {
    const payload = await getAccessPayload(accessToken);

    if (payload) {
      return NextResponse.next();
    }

    // Access missing/expired — refresh cookie still means "logged in"
    if (refreshToken) {
      return continueWithRefresh(request, pathname);
    }

    // No valid session at all
    return redirectToLogin(request, pathname, true);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
