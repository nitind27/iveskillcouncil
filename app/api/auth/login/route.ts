import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { authenticateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, rateLimitResponse } from "@/lib/api-response";
import { rateLimiter, rateLimitConfig, rateLimitKey } from "@/lib/rate-limit";
import { ROLES } from "@/lib/permissions";
import { sendOtpEmail } from "@/lib/email-otp";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const clientId = rateLimitKey("login", request);
    if (!rateLimiter.check(clientId, rateLimitConfig.login.maxRequests, rateLimitConfig.login.windowMs)) {
      return rateLimitResponse();
    }

    const body = await request.json();
    const { email, password } = body;

    console.log("🔐 Login attempt for:", email);

    if (!email || !password) {
      return errorResponse("Email and password are required", 400);
    }

    let authResult;
    try {
      authResult = await authenticateUser({ email, password });
    } catch (authError: unknown) {
      const msg = authError instanceof Error ? authError.message : String(authError);
      const name = (authError as { name?: string })?.name;
      if (
        msg === "DATABASE_UNAVAILABLE" ||
        name === "DatabaseUnavailableError" ||
        msg.includes("Can't reach database server") ||
        msg.includes("ECONNREFUSED")
      ) {
        console.error("❌ Database unreachable during login for:", email);
        return errorResponse(
          "Database unreachable. Run npm run dev (starts DB proxy on port 3307), wait ~5s, then retry.",
          503
        );
      }
      throw authError;
    }

    if (!authResult) {
      console.error("❌ Authentication failed for:", email);
      return errorResponse("Invalid email or password", 401);
    }

    // Institute Admin only: password OK → SMTP OTP required before session
    if (authResult.user.roleId === ROLES.ADMIN) {
      const normalizedEmail = authResult.user.email.trim().toLowerCase();
      const otp = randomBytes(3).readUIntBE(0, 3).toString().padStart(6, "0").slice(0, 6);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.otpVerification.updateMany({
        where: { email: normalizedEmail, purpose: "ADMIN_LOGIN", used: false },
        data: { used: true },
      });

      await prisma.otpVerification.create({
        data: {
          email: normalizedEmail,
          otp,
          purpose: "ADMIN_LOGIN",
          expiresAt,
        },
      });

      const sent = await sendOtpEmail(normalizedEmail, {
        otp,
        userName: authResult.user.fullName,
        purpose: "Admin (Institute) login",
      });

      if (!sent) {
        return errorResponse(
          "Password verified, but OTP email failed. Check SMTP settings and try again.",
          500
        );
      }

      console.log("✅ Admin password OK — OTP sent to:", normalizedEmail);
      return successResponse(
        {
          requiresOtp: true,
          email: normalizedEmail,
          roleName: authResult.user.roleName,
          expiresIn: 600,
        },
        "OTP sent to your email. Enter it to complete Admin (Institute) login."
      );
    }

    console.log("✅ Authentication successful for:", email);

    if (
      !process.env.JWT_ACCESS_SECRET ||
      process.env.JWT_ACCESS_SECRET === "your-access-token-secret-change-in-production"
    ) {
      console.error("❌ JWT_ACCESS_SECRET is not set or using default value!");
      return errorResponse("Server configuration error", 500);
    }

    const response = successResponse(
      {
        user: authResult.user,
        requiresOtp: false,
      },
      "Login successful"
    );

    const { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE, getAuthCookieOptions } = await import(
      "@/lib/auth-cookies"
    );
    const cookieOptions = getAuthCookieOptions();

    response.cookies.set("accessToken", authResult.accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    response.cookies.set("refreshToken", authResult.refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    return response;
  } catch (error: any) {
    console.error("❌ Login API error:", error);
    return errorResponse(error.message || "Login failed", 500);
  }
}
