import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Routes that are public — no login required (user panel = default for students/visitors)
const PUBLIC_PATHS = ["/login", "/api/auth", "/userpanel"];
const isPublicPath = (path: string) =>
  path === "/" ||
  path === "/userpanel" ||
  PUBLIC_PATHS.some((route) => path.startsWith(route));

// Protected routes — require login (multi-tenant: dashboard, franchises, students, fees, etc.)
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/")
  ) {
    return NextResponse.next();
  }

  // Public paths: user panel, login — allow without token
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (isProtectedPath(pathname)) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_ACCESS_SECRET!
      );
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch (error) {
      console.error("❌ Middleware JWT Error:", error);
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      return response;
    }
  }

  // Error pages and other paths — allow through
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
