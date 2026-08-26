import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, rateLimitResponse } from "@/lib/api-response";
import { rateLimiter, rateLimitConfig, rateLimitKey } from "@/lib/rate-limit";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { getEffectivePermissions } from "@/lib/get-effective-permissions";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * POST: Complete Admin (Institute) login after password + OTP.
 * Body: { email, otp }
 * Only role ADMIN (Institute). Other roles use normal password login.
 */
export async function POST(request: NextRequest) {
  try {
    const clientId = rateLimitKey("auth", request);
    if (
      !rateLimiter.check(
        clientId,
        rateLimitConfig.auth.maxRequests,
        rateLimitConfig.auth.windowMs
      )
    ) {
      return rateLimitResponse();
    }

    const body = await request.json();
    const email = body?.email?.trim()?.toLowerCase();
    const otp = body?.otp?.trim();

    if (!email || !otp) {
      return errorResponse("Email and OTP are required", 400);
    }

    if (!/^\d{6}$/.test(otp)) {
      return errorResponse("OTP must be a 6-digit code", 400);
    }

    const record = await prisma.otpVerification.findFirst({
      where: {
        email,
        otp,
        purpose: "ADMIN_LOGIN",
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return errorResponse("Invalid or expired OTP", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        franchise: {
          select: { id: true, name: true, status: true, state: true },
        },
      },
    });

    if (!user || user.status !== "ACTIVE" || user.mustChangePassword) {
      return errorResponse("Invalid request", 400);
    }

    if (user.roleId !== ROLES.ADMIN) {
      return errorResponse("OTP login step is only for Admin (Institute)", 403);
    }

    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { used: true },
    });

    const permissions = await getEffectivePermissions(
      user.roleId,
      user.franchiseId?.toString()
    );

    const accessToken = generateAccessToken({
      userId: user.id.toString(),
      roleId: user.roleId,
      franchiseId: user.franchiseId?.toString(),
      email: user.email,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id.toString(),
      tokenId: `${user.id}-${Date.now()}`,
    });

    const response = successResponse(
      {
        user: {
          id: user.id.toString(),
          fullName: user.fullName,
          email: user.email,
          roleId: user.roleId,
          roleName: user.role.name,
          franchiseId: user.franchiseId?.toString(),
          franchise: user.franchise
            ? {
                id: user.franchise.id.toString(),
                name: user.franchise.name,
                status: user.franchise.status,
                state: user.franchise.state ?? undefined,
              }
            : null,
          permissions,
        },
      },
      "Login successful"
    );

    const { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE, getAuthCookieOptions } = await import(
      "@/lib/auth-cookies"
    );
    const cookieOptions = getAuthCookieOptions();

    response.cookies.set("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });
    response.cookies.set("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    return response;
  } catch (err) {
    console.error("Verify admin OTP login error:", err);
    return errorResponse("Failed to login", 500);
  }
}
