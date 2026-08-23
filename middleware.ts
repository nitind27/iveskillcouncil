import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Routes that are public — no login required (user panel = default for students/visitors)
const PUBLIC_PATHS = ["/login", "/api/auth", "/userpanel"];
const isPublicPath = (path: string) =>
  path === "/" ||
  path === "/userpanel" ||
  PUBLIC_PATHS.some((route) => path.startsWith(route));

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
  path.startsWith("/certificates") ||
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
  path.startsWith("/certificate");

async function isAccessTokenValid(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
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

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (isProtectedPath(pathname)) {
    const accessOk = await isAccessTokenValid(accessToken);

    if (accessOk) {
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
