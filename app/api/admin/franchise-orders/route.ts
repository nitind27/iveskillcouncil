import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { successResponse, errorResponse, forbiddenResponse } from "@/lib/api-response";
import { formatFranchiseOrder } from "@/lib/franchise-order-format";

export const dynamic = "force-dynamic";

/** GET /api/admin/franchise-orders — list franchise plan payments with Easy Split status */
export async function GET(request: NextRequest) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const params = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(10, parseInt(params.get("limit") || "20", 10)));
    const status = params.get("status") || undefined;
    const splitFilter = params.get("split") || undefined;
    const q = (params.get("q") || "").trim();

    const where: Prisma.FranchiseOrderWhereInput = {};
    if (status && ["PENDING", "PAID", "FAILED", "EXPIRED"].includes(status)) {
      where.status = status as Prisma.EnumFranchiseOrderStatusFilter["equals"];
    }
    if (splitFilter === "configured") {
      where.splitConfigSnapshot = { not: Prisma.DbNull };
    } else if (splitFilter === "applied") {
      where.splitApplied = true;
    } else if (splitFilter === "failed") {
      where.splitStatus = { startsWith: "SPLIT_FAILED" };
    } else if (splitFilter === "none") {
      where.splitConfigSnapshot = { equals: Prisma.DbNull };
    }
    if (q) {
      where.OR = [
        { orderId: { contains: q } },
        { fullName: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    const [orders, total, statsRows] = await Promise.all([
      prisma.franchiseOrder.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { plan: { select: { name: true, price: true } } },
      }),
      prisma.franchiseOrder.count({ where }),
      prisma.franchiseOrder.groupBy({
        by: ["status"],
        _count: { _all: true },
        _sum: { amount: true },
      }),
    ]);

    const [splitAppliedCount, splitFailedCount, splitConfiguredCount] = await Promise.all([
      prisma.franchiseOrder.count({ where: { splitApplied: true } }),
      prisma.franchiseOrder.count({ where: { splitStatus: { startsWith: "SPLIT_FAILED" } } }),
      prisma.franchiseOrder.count({
        where: { splitConfigSnapshot: { not: Prisma.DbNull } },
      }),
    ]);

    const statusMap: Record<string, { count: number; amount: number }> = {};
    for (const row of statsRows) {
      statusMap[row.status] = {
        count: row._count._all,
        amount: Number(row._sum.amount || 0),
      };
    }

    const items = orders.map((o) => formatFranchiseOrder(o));

    return successResponse(
      {
        items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        summary: {
          totalOrders: Object.values(statusMap).reduce((s, x) => s + x.count, 0),
          pending: statusMap.PENDING?.count || 0,
          paid: statusMap.PAID?.count || 0,
          failed: (statusMap.FAILED?.count || 0) + (statusMap.EXPIRED?.count || 0),
          paidAmount: statusMap.PAID?.amount || 0,
          splitConfigured: splitConfiguredCount,
          splitApplied: splitAppliedCount,
          splitFailed: splitFailedCount,
        },
      },
      "Franchise orders"
    );
  } catch (err) {
    console.error("admin/franchise-orders GET:", err);
    return errorResponse("Failed to fetch orders", 500);
  }
}
