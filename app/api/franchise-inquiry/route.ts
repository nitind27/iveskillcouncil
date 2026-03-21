import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";
import { getClientIdentifier } from "@/lib/rate-limit";
import { rateLimiter, rateLimitConfig } from "@/lib/rate-limit";

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
    const { fullName, email, phone, city, state, investmentRange, message, franchiseId, franchiseName } = body;

    if (!fullName?.trim() || !email?.trim() || !phone?.trim()) {
      return errorResponse("Name, email and phone are required.", 400);
    }
    const nameR = validateName(String(fullName).trim());
    const emailR = validateEmail(String(email).trim());
    const phoneR = validatePhone(String(phone).trim());
    if (!nameR.valid) return errorResponse(nameR.error!, 400);
    if (!emailR.valid) return errorResponse(emailR.error!, 400);
    if (!phoneR.valid) return errorResponse(phoneR.error!, 400);

    await prisma.franchiseInquiry.create({
      data: {
        fullName: String(fullName).trim(),
        email: String(email).trim().toLowerCase(),
        phone: String(phone).trim(),
        city: city ? String(city).trim() : null,
        state: state ? String(state).trim() : null,
        investmentRange: investmentRange ? String(investmentRange).trim() : null,
        message: message ? String(message).trim() : null,
        franchiseId: franchiseId ? String(franchiseId).trim() : null,
        franchiseName: franchiseName ? String(franchiseName).trim() : null,
      },
    });

    return successResponse(
      { submitted: true },
      "Franchise inquiry submitted successfully. Our team will contact you shortly."
    );
  } catch (error: unknown) {
    console.error("Franchise inquiry API error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to submit inquiry",
      500
    );
  }
}
