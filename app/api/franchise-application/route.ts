import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";
import { rateLimiter, rateLimitConfig, getClientIdentifier } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** POST /api/franchise-application — public, no auth */
export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    if (!rateLimiter.check(clientId, rateLimitConfig.api.maxRequests, rateLimitConfig.api.windowMs)) {
      return errorResponse("Too many requests", 429);
    }

    const body = await request.json();
    const {
      fullName, email, phone, alternatePhone,
      instituteName, businessType,
      address, city, state, pincode,
      planId, message, documents,
    } = body;

    // Validate required
    if (!fullName?.trim() || !email?.trim() || !phone?.trim() || !instituteName?.trim() || !address?.trim() || !city?.trim() || !state?.trim() || !pincode?.trim()) {
      return errorResponse("All required fields must be filled", 400);
    }
    const nameR  = validateName(String(fullName).trim());
    const emailR = validateEmail(String(email).trim());
    const phoneR = validatePhone(String(phone).trim());
    if (!nameR.valid)  return errorResponse(nameR.error!, 400);
    if (!emailR.valid) return errorResponse(emailR.error!, 400);
    if (!phoneR.valid) return errorResponse(phoneR.error!, 400);

    // Check duplicate application
    const existing = await prisma.franchiseApplication.findFirst({
      where: { email: String(email).trim().toLowerCase(), status: { in: ["PENDING", "APPROVED"] } },
    });
    if (existing) return errorResponse("An application with this email is already pending or approved.", 409);

    const app = await prisma.franchiseApplication.create({
      data: {
        fullName:     String(fullName).trim(),
        email:        String(email).trim().toLowerCase(),
        phone:        String(phone).trim(),
        alternatPhone: alternatePhone ? String(alternatePhone).trim() : null,
        instituteName: String(instituteName).trim(),
        businessType:  String(businessType || "INDIVIDUAL").trim(),
        address:      String(address).trim(),
        city:         String(city).trim(),
        state:        String(state).trim(),
        pincode:      String(pincode).trim(),
        planId:       planId ? Number(planId) : null,
        message:      message ? String(message).trim() : null,
        documents:    Array.isArray(documents) ? documents : [],
        status:       "PENDING",
      },
    });

    return successResponse(
      { id: app.id.toString(), status: app.status },
      "Application submitted successfully. Our team will review and contact you within 2-3 business days."
    );
  } catch (err) {
    console.error("franchise-application POST:", err);
    return errorResponse("Failed to submit application", 500);
  }
}
