import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { successResponse, errorResponse, forbiddenResponse } from "@/lib/api-response";
import { formatFranchiseOrder } from "@/lib/franchise-order-format";

export const dynamic = "force-dynamic";

/** GET /api/admin/franchise-orders/[orderId] — order detail with split breakdown */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const { orderId } = await params;
    const order = await prisma.franchiseOrder.findUnique({
      where: { orderId },
      include: { plan: { select: { name: true, price: true, durationInDays: true } } },
    });
    if (!order) return errorResponse("Order not found", 404);

    const application = await prisma.franchiseApplication.findFirst({
      where: { email: order.email },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        instituteName: true,
        status: true,
        createdAt: true,
      },
    });

    return successResponse({
      ...formatFranchiseOrder(order),
      planDurationDays: order.plan?.durationInDays ?? null,
      linkedApplication: application
        ? {
            id: application.id.toString(),
            instituteName: application.instituteName,
            status: application.status,
            createdAt: application.createdAt.toISOString(),
          }
        : null,
    });
  } catch (err) {
    console.error("admin/franchise-orders/[orderId] GET:", err);
    return errorResponse("Failed to fetch order", 500);
  }
}
