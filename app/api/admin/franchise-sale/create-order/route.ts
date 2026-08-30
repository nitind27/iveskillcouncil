import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createFranchisePaymentOrder } from "@/lib/franchise-order-create";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { successResponse, errorResponse, forbiddenResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/franchise-sale/create-order
 * Institute admin creates franchise fee payment for a franchise owner (applicant).
 * Payment settles to institute owner bank via Easy Split.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const body = await request.json();
    const { applicationId, planId, amount, fullName, email, phone, city, state, address } = body;

    let app = null;
    if (applicationId) {
      app = await prisma.franchiseApplication.findUnique({
        where: { id: BigInt(applicationId) },
      });
      if (!app) return errorResponse("Application not found", 404);
    }

    const resolvedPlanId = planId != null ? Number(planId) : app?.planId;
    if (!resolvedPlanId) return errorResponse("Select a franchise plan", 400);

    const pendingExisting = applicationId
      ? await prisma.franchiseOrder.findFirst({
          where: { applicationId: BigInt(applicationId), status: "PENDING" },
          orderBy: { createdAt: "desc" },
        })
      : null;

    if (pendingExisting?.paymentSessionId) {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
      return successResponse(
        {
          orderId: pendingExisting.orderId,
          paymentSessionId: pendingExisting.paymentSessionId,
          amount: Number(pendingExisting.amount),
          planName: pendingExisting.planName,
          paymentUrl: `${appUrl}/userpanel/franchise-payment/pay?order_id=${pendingExisting.orderId}`,
          existing: true,
        },
        "Pending payment link already exists for this application"
      );
    }

    const result = await createFranchisePaymentOrder({
      fullName: fullName?.trim() || app?.fullName || "",
      email: email?.trim() || app?.email || "",
      phone: phone?.trim() || app?.phone || "",
      planId: resolvedPlanId,
      amount: amount != null ? Number(amount) : undefined,
      city: city?.trim() || app?.city || null,
      state: state?.trim() || app?.state || null,
      address: address?.trim() || app?.address || null,
      message: app?.instituteName ? `Franchise: ${app.instituteName}` : null,
      applicationId: applicationId ? BigInt(applicationId) : null,
      createdByAdmin: BigInt(user.id),
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
      "Payment link created — share with franchise owner"
    );
  } catch (err) {
    console.error("admin/franchise-sale/create-order:", err);
    return errorResponse("Failed to create payment", 500);
  }
}

/** GET — latest payment status for an application */
export async function GET(request: NextRequest) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const applicationId = request.nextUrl.searchParams.get("applicationId");
    if (!applicationId) return errorResponse("applicationId required", 400);

    const orders = await prisma.franchiseOrder.findMany({
      where: { applicationId: BigInt(applicationId) },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return successResponse({
      orders: orders.map((o) => ({
        orderId: o.orderId,
        amount: Number(o.amount),
        status: o.status,
        splitApplied: o.splitApplied,
        splitStatus: o.splitStatus,
        createdAt: o.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("admin/franchise-sale GET:", err);
    return errorResponse("Failed to fetch payments", 500);
  }
}
