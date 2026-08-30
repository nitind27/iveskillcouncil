import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCashfreeOrder } from "@/lib/cashfree";
import { applyFranchiseOrderSplit } from "@/lib/franchise-split";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { successResponse, errorResponse, forbiddenResponse } from "@/lib/api-response";
import { formatFranchiseOrder } from "@/lib/franchise-order-format";

export const dynamic = "force-dynamic";

/** POST /api/admin/franchise-orders/[orderId]/verify — sync payment status from Cashfree */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const { orderId } = await params;
    const order = await prisma.franchiseOrder.findUnique({ where: { orderId } });
    if (!order) return errorResponse("Order not found", 404);

    const cfResult = await verifyCashfreeOrder(order.orderId);
    if (!cfResult.success) {
      return errorResponse(`Cashfree verify failed: ${cfResult.error}`, 502);
    }

    const cfStatus = cfResult.data.order_status;
    const payment = cfResult.data.payments?.[0];

    let newStatus: "PAID" | "FAILED" | "PENDING" | "EXPIRED" = "PENDING";
    if (cfStatus === "PAID") newStatus = "PAID";
    else if (cfStatus === "EXPIRED" || cfStatus === "CANCELLED") newStatus = "EXPIRED";
    else if (payment?.payment_status === "FAILED") newStatus = "FAILED";

    const splitWasConfigured = order.splitStatus === "CONFIGURED_AT_ORDER";

    await prisma.franchiseOrder.update({
      where: { orderId },
      data: {
        status: newStatus,
        cfPaymentId: payment?.cf_payment_id || order.cfPaymentId,
        paymentMode: payment?.payment_method?.type || order.paymentMode,
        ...(newStatus === "PAID" && splitWasConfigured
          ? { splitApplied: true, splitStatus: "SPLIT_AT_ORDER" }
          : {}),
      },
    });

    if (newStatus === "PAID" && !splitWasConfigured && !order.splitApplied) {
      await applyFranchiseOrderSplit(orderId);
    }

    const updated = await prisma.franchiseOrder.findUnique({
      where: { orderId },
      include: { plan: { select: { name: true, price: true } } },
    });

    return successResponse(
      formatFranchiseOrder(updated!),
      `Payment status synced: ${newStatus}`
    );
  } catch (err) {
    console.error("admin/franchise-orders verify:", err);
    return errorResponse("Verification failed", 500);
  }
}
