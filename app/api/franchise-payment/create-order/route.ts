import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCashfreeOrder } from "@/lib/cashfree";
import { successResponse, errorResponse } from "@/lib/api-response";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";
import { rateLimiter, rateLimitConfig, getClientIdentifier } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function generateOrderId(): string {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `FRN-${ts}-${rnd}`;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const clientId = getClientIdentifier(request);
    if (!rateLimiter.check(clientId, rateLimitConfig.api.maxRequests, rateLimitConfig.api.windowMs)) {
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    const body = await request.json();
    const { fullName, email, phone, planId, city, state, address, message } = body;

    // Validate
    if (!fullName?.trim() || !email?.trim() || !phone?.trim() || !planId) {
      return errorResponse("Name, email, phone and plan are required.", 400);
    }
    const nameR  = validateName(String(fullName).trim());
    const emailR = validateEmail(String(email).trim());
    const phoneR = validatePhone(String(phone).trim());
    if (!nameR.valid)  return errorResponse(nameR.error!,  400);
    if (!emailR.valid) return errorResponse(emailR.error!, 400);
    if (!phoneR.valid) return errorResponse(phoneR.error!, 400);

    // Fetch plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: Number(planId) },
    });
    if (!plan || plan.status !== "ACTIVE") {
      return errorResponse("Selected plan is not available.", 400);
    }

    const amount  = Number(plan.price);
    const orderId = generateOrderId();
    const appUrl  = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create Cashfree order
    const cfResult = await createCashfreeOrder({
      orderId,
      amount,
      customerName:  String(fullName).trim(),
      customerEmail: String(email).trim().toLowerCase(),
      customerPhone: String(phone).trim(),
      returnUrl: `${appUrl}/userpanel/franchise-payment/status?order_id=${orderId}`,
      notifyUrl: `${appUrl}/api/franchise-payment/webhook`,
      orderNote: `Franchise Plan: ${plan.name}`,
    });

    if (!cfResult.success) {
      return errorResponse(`Payment gateway error: ${cfResult.error}`, 502);
    }

    // Save order to DB
    await prisma.franchiseOrder.create({
      data: {
        orderId,
        cfOrderId:        cfResult.data.cf_order_id,
        fullName:         String(fullName).trim(),
        email:            String(email).trim().toLowerCase(),
        phone:            String(phone).trim(),
        planId:           plan.id,
        planName:         plan.name,
        amount:           amount,
        status:           "PENDING",
        paymentSessionId: cfResult.data.payment_session_id,
        city:             city    ? String(city).trim()    : null,
        state:            state   ? String(state).trim()   : null,
        address:          address ? String(address).trim() : null,
        message:          message ? String(message).trim() : null,
      },
    });

    return successResponse(
      {
        orderId,
        paymentSessionId: cfResult.data.payment_session_id,
        amount,
        planName: plan.name,
      },
      "Order created"
    );
  } catch (err) {
    console.error("franchise-payment/create-order:", err);
    return errorResponse("Failed to create order", 500);
  }
}
