import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";
import { hasPermission } from "@/lib/permissions";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * GET /api/franchises/plans
 * Returns ACTIVE subscription plans for the Add Franchise form.
 * Requires: SUPER_ADMIN, or franchises.manage, or franchises.view, or subscription.plans.view
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const roleId = Number(user.roleId);
    const isSuperAdminOrAdmin = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;
    const canView =
      isSuperAdminOrAdmin ||
      (user.permissions &&
        (hasPermission(user.permissions, "subscription.plans.view") ||
          hasPermission(user.permissions, "franchises.manage") ||
          hasPermission(user.permissions, "franchises.view")));

    if (!canView) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { id: "asc" },
    });

    const data = plans.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      durationInDays: p.durationInDays,
      status: p.status,
    }));

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("GET /api/franchises/plans", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}
