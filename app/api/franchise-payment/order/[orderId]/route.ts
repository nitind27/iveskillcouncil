import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** GET /api/franchise-payment/order/[orderId] — public: pending order checkout info */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const order = await prisma.franchiseOrder.findUnique({
      where: { orderId },
      select: {
        orderId: true,
        fullName: true,
        planName: true,
        amount: true,
        status: true,
        paymentSessionId: true,
      },
    });

    if (!order) return errorResponse("Order not found", 404);
    if (order.status !== "PENDING") {
      return errorResponse(`Order is already ${order.status.toLowerCase()}`, 400);
    }
    if (!order.paymentSessionId) {
      return errorResponse("Payment session expired. Contact institute admin.", 400);
    }

    return successResponse({
      orderId: order.orderId,
      fullName: order.fullName,
      planName: order.planName,
      amount: Number(order.amount),
      paymentSessionId: order.paymentSessionId,
    });
  } catch (err) {
    console.error("franchise-payment/order GET:", err);
    return errorResponse("Failed to load order", 500);
  }
}
