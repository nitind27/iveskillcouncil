import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, unauthorizedResponse, errorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { hasPermission } from "@/lib/permissions";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** GET /api/admin/plans - List all subscription plans (for subscription/plans UI). */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    const roleId = Number(user.roleId);
    const isSuperAdminOrAdmin = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;
    const canView = isSuperAdminOrAdmin || (user.permissions && hasPermission(user.permissions, "subscription.plans.view"));
    if (!canView) {
      return errorResponse("Forbidden", 403);
    }

    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { id: "asc" },
    });
    const serialized = plans.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      durationInDays: p.durationInDays,
      status: p.status,
    }));
    return successResponse(serialized);
  } catch (e) {
    console.error("GET /api/admin/plans", e);
    return errorResponse("Failed to fetch plans", 500);
  }
}
