import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, rateLimitResponse } from "@/lib/api-response";
import { rateLimiter, rateLimitConfig, getClientIdentifier } from "@/lib/rate-limit";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { getEffectivePermissions } from "@/lib/get-effective-permissions";

export const dynamic = "force-dynamic";

/** POST: Verify OTP and login (no password). Body: { email, otp } */
export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    if (!rateLimiter.check(clientId, rateLimitConfig.auth.maxRequests, rateLimitConfig.auth.windowMs)) {
      return rateLimitResponse();
    }

    const body = await request.json();
    const email = body?.email?.trim()?.toLowerCase();
    const otp = body?.otp?.trim();

    if (!email || !otp) {
      return errorResponse("Email and OTP are required", 400);
    }

    const record = await prisma.otpVerification.findFirst({
      where: {
        email,
        otp,
        purpose: "LOGIN",
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

    if (!user || user.mustChangePassword || user.status !== "ACTIVE") {
      return errorResponse("Invalid request", 400);
    }

    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { used: true },
    });

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
      "Login successful"
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
    console.error("Verify OTP login error:", err);
    return errorResponse("Failed to login", 500);
  }
}
