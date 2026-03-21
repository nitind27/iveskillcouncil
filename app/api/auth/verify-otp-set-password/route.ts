import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, rateLimitResponse } from "@/lib/api-response";
import { rateLimiter, rateLimitConfig, getClientIdentifier } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/auth";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { getEffectivePermissions } from "@/lib/get-effective-permissions";

export const dynamic = "force-dynamic";

/** POST: Verify OTP and set password. Body: { email, otp, newPassword } */
export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    if (!rateLimiter.check(clientId, rateLimitConfig.auth.maxRequests, rateLimitConfig.auth.windowMs)) {
      return rateLimitResponse();
    }

    const body = await request.json();
    const email = body?.email?.trim()?.toLowerCase();
    const otp = body?.otp?.trim();
    const newPassword = body?.newPassword;

    if (!email || !otp || !newPassword) {
      return errorResponse("Email, OTP and new password are required", 400);
    }
    if (newPassword.length < 8) {
      return errorResponse("Password must be at least 8 characters", 400);
    }

    const record = await prisma.otpVerification.findFirst({
      where: {
        email,
        otp,
        purpose: "FIRST_TIME_SETUP",
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
      include: { role: true },
    });

    if (!user || !user.mustChangePassword) {
      return errorResponse("Invalid request", 400);
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword, mustChangePassword: false },
      }),
      prisma.otpVerification.update({
        where: { id: record.id },
        data: { used: true },
      }),
    ]);

    const permissions = await getEffectivePermissions(user.roleId, user.franchiseId?.toString());
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
          permissions,
        },
      },
      "Password set successfully. Redirecting to dashboard..."
    );

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      path: "/",
    };

    response.cookies.set("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 });
    response.cookies.set("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 });

    return response;
  } catch (err) {
    console.error("Verify OTP set password error:", err);
    return errorResponse("Failed to set password", 500);
  }
}
