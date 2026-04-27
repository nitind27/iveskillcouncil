import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCashfreeOrder } from "@/lib/cashfree";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) return errorResponse("orderId is required", 400);

    // Find order in DB
    const order = await prisma.franchiseOrder.findUnique({
      where: { orderId: String(orderId) },
      include: { plan: true },
    });

    if (!order) return errorResponse("Order not found", 404);

    // If already confirmed, return cached status
    if (order.status === "PAID") {
      return successResponse(
        {
          status: "PAID",
          orderId: order.orderId,
          planName: order.planName,
          amount: Number(order.amount),
          fullName: order.fullName,
          email: order.email,
        },
        "Payment already verified"
      );
    }

    // Verify with Cashfree
    const cfResult = await verifyCashfreeOrder(order.orderId);
    if (!cfResult.success) {
      return errorResponse(`Verification failed: ${cfResult.error}`, 502);
    }

    const cfStatus = cfResult.data.order_status;
    const payment  = cfResult.data.payments?.[0];

    let newStatus: "PAID" | "FAILED" | "PENDING" | "EXPIRED" = "PENDING";
    if (cfStatus === "PAID")      newStatus = "PAID";
    else if (cfStatus === "EXPIRED" || cfStatus === "CANCELLED") newStatus = "EXPIRED";
    else if (payment?.payment_status === "FAILED") newStatus = "FAILED";

    // Update DB
    await prisma.franchiseOrder.update({
      where: { orderId: order.orderId },
      data: {
        status:       newStatus,
        cfPaymentId:  payment?.cf_payment_id  || null,
        paymentMode:  payment?.payment_method?.type || null,
      },
    });

    return successResponse(
      {
        status:   newStatus,
        orderId:  order.orderId,
        planName: order.planName,
        amount:   Number(order.amount),
        fullName: order.fullName,
        email:    order.email,
        phone:    order.phone,
      },
      `Payment ${newStatus.toLowerCase()}`
    );
  } catch (err) {
    console.error("franchise-payment/verify:", err);
    return errorResponse("Verification failed", 500);
  }
}
