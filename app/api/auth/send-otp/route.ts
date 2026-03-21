import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, rateLimitResponse } from "@/lib/api-response";
import { rateLimiter, rateLimitConfig, getClientIdentifier } from "@/lib/rate-limit";
import { sendOtpEmail } from "@/lib/email-otp";

export const dynamic = "force-dynamic";

/** POST: Send OTP for first-time setup. Body: { email } */
export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    if (!rateLimiter.check(clientId, rateLimitConfig.auth.maxRequests, rateLimitConfig.auth.windowMs)) {
      return rateLimitResponse();
    }

    const body = await request.json();
    const email = body?.email?.trim()?.toLowerCase();
    if (!email) return errorResponse("Email is required", 400);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, fullName: true, mustChangePassword: true },
    });

    if (!user) return errorResponse("No account found with this email", 404);
    if (!user.mustChangePassword) {
      return errorResponse("Account already set up. Use email and password to login.", 400);
    }

    const otp = randomBytes(3).readUIntBE(0, 3).toString().padStart(6, "0").slice(0, 6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpVerification.create({
      data: {
        email,
        otp,
        purpose: "FIRST_TIME_SETUP",
        expiresAt,
      },
    });

    const sent = await sendOtpEmail(email, {
      otp,
      userName: user.fullName,
      purpose: "first-time setup",
    });

    if (!sent) {
      return errorResponse("Failed to send OTP. Please try again.", 500);
    }

    return successResponse(
      { expiresIn: 600 },
      "OTP sent to your email. Valid for 10 minutes."
    );
  } catch (err) {
    console.error("Send OTP error:", err);
    return errorResponse("Failed to send OTP", 500);
  }
}
