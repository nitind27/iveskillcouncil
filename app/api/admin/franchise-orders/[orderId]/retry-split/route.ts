import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyFranchiseOrderSplit } from "@/lib/franchise-split";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { successResponse, errorResponse, forbiddenResponse } from "@/lib/api-response";
import { formatFranchiseOrder } from "@/lib/franchise-order-format";

export const dynamic = "force-dynamic";

/** POST /api/admin/franchise-orders/[orderId]/retry-split — retry Easy Split after payment */
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

    if (order.status !== "PAID") {
      return errorResponse("Split can only be applied after payment is PAID", 400);
    }

    if (order.splitApplied && order.splitStatus === "SPLIT_AT_ORDER") {
      return errorResponse("Split was already applied at order creation", 400);
    }

    if (!order.splitConfigSnapshot) {
      return errorResponse("No split configuration on this order. Configure Easy Split on the plan first.", 400);
    }

    await prisma.franchiseOrder.update({
      where: { orderId },
      data: { splitApplied: false, splitStatus: "RETRY_PENDING" },
    });

    await applyFranchiseOrderSplit(orderId);

    const updated = await prisma.franchiseOrder.findUnique({
      where: { orderId },
      include: { plan: { select: { name: true, price: true } } },
    });

    const formatted = formatFranchiseOrder(updated!);
    if (!updated?.splitApplied) {
      return errorResponse(
        updated?.splitStatus?.replace("SPLIT_FAILED: ", "") || "Split retry failed",
        502
      );
    }

    return successResponse(formatted, "Easy Split applied successfully");
  } catch (err) {
    console.error("admin/franchise-orders retry-split:", err);
    return errorResponse("Split retry failed", 500);
  }
}
