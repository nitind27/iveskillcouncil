import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getClientIdentifier } from "@/lib/rate-limit";
import { rateLimiter, rateLimitConfig } from "@/lib/rate-limit";
import { sendEnrollmentNotification } from "@/lib/email";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    if (
      !rateLimiter.check(
        clientId,
        rateLimitConfig.api.maxRequests,
        rateLimitConfig.api.windowMs
      )
    ) {
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    const body = await request.json();
    const { fullName, email, phone, courseName, message, address, pincode, area, city, state } = body;

    if (!fullName?.trim() || !email?.trim() || !phone?.trim() || !courseName?.trim()) {
      return errorResponse("Name, email, phone and course are required.", 400);
    }
    const nameR = validateName(String(fullName).trim());
    const emailR = validateEmail(String(email).trim());
    const phoneR = validatePhone(String(phone).trim());
    if (!nameR.valid) return errorResponse(nameR.error!, 400);
    if (!emailR.valid) return errorResponse(emailR.error!, 400);
    if (!phoneR.valid) return errorResponse(phoneR.error!, 400);

    await prisma.courseEnrollmentRequest.create({
      data: {
        fullName: String(fullName).trim(),
        email: String(email).trim().toLowerCase(),
        phone: String(phone).trim(),
        courseName: String(courseName).trim(),
        message: message ? String(message).trim() : null,
        address: address ? String(address).trim().slice(0, 500) : null,
        pincode: pincode ? String(pincode).trim().slice(0, 10) : null,
        area: area ? String(area).trim().slice(0, 150) : null,
        city: city ? String(city).trim().slice(0, 100) : null,
        state: state ? String(state).trim().slice(0, 100) : null,
      },
    });

    // Notify super admin via SMTP (optional; do not fail request if email fails)
    const emailResult = await sendEnrollmentNotification({
      fullName: String(fullName).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      courseName: String(courseName).trim(),
      message: message ? String(message).trim() : null,
      address: address ? String(address).trim() : undefined,
      pincode: pincode ? String(pincode).trim() : undefined,
      area: area ? String(area).trim() : undefined,
      city: city ? String(city).trim() : undefined,
      state: state ? String(state).trim() : undefined,
    });
    if (!emailResult.success) {
      console.warn("Enrollment: SMTP notification failed:", emailResult.error);
    }

    return successResponse(
      { submitted: true },
      "Enrollment request submitted successfully. We will contact you shortly."
    );
  } catch (error: unknown) {
    console.error("Enrollment API error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return errorResponse(
        "Database table `course_enrollment_requests` is missing. Run the DB fix script to create it.",
        503
      );
    }
    return errorResponse(
      error instanceof Error ? error.message : "Failed to submit enrollment request",
      500
    );
  }
}
