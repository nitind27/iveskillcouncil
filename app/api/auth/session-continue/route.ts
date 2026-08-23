import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyRefreshToken, generateAccessToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { ACCESS_TOKEN_MAX_AGE, getAuthCookieOptions } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

/**
 * Bridge used by middleware when accessToken is expired/missing but refreshToken is valid.
 * Issues a fresh accessToken and redirects back to the original protected path.
 * Never logs the user out while refreshToken is still valid.
 */
export async function GET(request: NextRequest) {
  const redirectParam = request.nextUrl.searchParams.get("redirect") || "/dashboard";
  const safeRedirect = redirectParam.startsWith("/") && !redirectParam.startsWith("//")
    ? redirectParam
    : "/dashboard";

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", safeRedirect);

  try {
    const cookieStore = cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.redirect(loginUrl);
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      const res = NextResponse.redirect(loginUrl);
      res.cookies.set("accessToken", "", { ...getAuthCookieOptions(), maxAge: 0 });
      res.cookies.set("refreshToken", "", { ...getAuthCookieOptions(), maxAge: 0 });
      return res;
    }

    const userData = await prisma.user.findUnique({
      where: { id: BigInt(payload.userId) },
      select: {
        id: true,
        email: true,
        roleId: true,
        franchiseId: true,
        status: true,
      },
    });

    if (!userData || userData.status !== "ACTIVE") {
      const res = NextResponse.redirect(loginUrl);
      res.cookies.set("accessToken", "", { ...getAuthCookieOptions(), maxAge: 0 });
      res.cookies.set("refreshToken", "", { ...getAuthCookieOptions(), maxAge: 0 });
      return res;
    }

    const newAccessToken = generateAccessToken({
      userId: userData.id.toString(),
      roleId: userData.roleId,
      franchiseId: userData.franchiseId?.toString(),
      email: userData.email,
    });

    const res = NextResponse.redirect(new URL(safeRedirect, request.url));
    res.cookies.set("accessToken", newAccessToken, {
      ...getAuthCookieOptions(),
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });
    return res;
  } catch (error) {
    console.error("session-continue error:", error);
    return NextResponse.redirect(loginUrl);
  }
}
