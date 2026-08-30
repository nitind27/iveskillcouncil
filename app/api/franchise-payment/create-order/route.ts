import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createFranchisePaymentOrder } from "@/lib/franchise-order-create";
import { successResponse, errorResponse } from "@/lib/api-response";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";
import { rateLimiter, rateLimitConfig, getClientIdentifier } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    if (!rateLimiter.check(clientId, rateLimitConfig.api.maxRequests, rateLimitConfig.api.windowMs)) {
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    const body = await request.json();
    const { fullName, email, phone, planId, city, state, address, message } = body;

    if (!fullName?.trim() || !email?.trim() || !phone?.trim() || !planId) {
      return errorResponse("Name, email, phone and plan are required.", 400);
    }
    const nameR = validateName(String(fullName).trim());
    const emailR = validateEmail(String(email).trim());
    const phoneR = validatePhone(String(phone).trim());
    if (!nameR.valid) return errorResponse(nameR.error!, 400);
    if (!emailR.valid) return errorResponse(emailR.error!, 400);
    if (!phoneR.valid) return errorResponse(phoneR.error!, 400);

    const result = await createFranchisePaymentOrder({
      fullName: String(fullName),
      email: String(email),
      phone: String(phone),
      planId: Number(planId),
      city: city ? String(city) : null,
      state: state ? String(state) : null,
      address: address ? String(address) : null,
      message: message ? String(message) : null,
    });

    if (!result.ok) return errorResponse(result.error, result.status);

    return successResponse(
      {
        orderId: result.orderId,
        paymentSessionId: result.paymentSessionId,
        amount: result.amount,
        planName: result.planName,
        easySplitEnabled: result.easySplitEnabled,
        paymentUrl: result.paymentUrl,
      },
      "Order created"
    );
  } catch (err) {
    console.error("franchise-payment/create-order:", err);
    return errorResponse("Failed to create order", 500);
  }
}
