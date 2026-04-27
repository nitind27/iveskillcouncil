import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { successResponse, errorResponse, forbiddenResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** GET /api/admin/franchise-orders — list all franchise plan purchase orders */
export async function GET(request: NextRequest) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const params = request.nextUrl.searchParams;
    const page   = Math.max(1, parseInt(params.get("page") || "1"));
    const limit  = Math.min(50, Math.max(10, parseInt(params.get("limit") || "20")));
    const status = params.get("status") || undefined;

    const where = status ? { status: status as "PENDING" | "PAID" | "FAILED" | "EXPIRED" } : {};

    const [orders, total] = await Promise.all([
      prisma.franchiseOrder.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { plan: { select: { name: true, price: true } } },
      }),
      prisma.franchiseOrder.count({ where }),
    ]);

    const items = orders.map((o) => ({
      id:          o.id.toString(),
      orderId:     o.orderId,
      cfOrderId:   o.cfOrderId,
      cfPaymentId: o.cfPaymentId,
      fullName:    o.fullName,
      email:       o.email,
      phone:       o.phone,
      planName:    o.planName,
      amount:      Number(o.amount),
      status:      o.status,
      paymentMode: o.paymentMode,
      city:        o.city,
      state:       o.state,
      address:     o.address,
      message:     o.message,
      createdAt:   o.createdAt.toISOString(),
    }));

    return successResponse(
      { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
      "Franchise orders"
    );
  } catch (err) {
    console.error("admin/franchise-orders GET:", err);
    return errorResponse("Failed to fetch orders", 500);
  }
}
