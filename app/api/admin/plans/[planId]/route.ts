import { NextRequest } from "next/server";
import { PlanStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, forbiddenResponse } from "@/lib/api-response";
import { requireSuperAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/plans/[planId] - Update plan details (SUPER_ADMIN only). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const user = await requireSuperAdmin();
    if (!user) return forbiddenResponse();

    const { planId } = await params;
    const planIdNum = parseInt(planId, 10);
    if (Number.isNaN(planIdNum)) return errorResponse("Invalid plan ID", 400);

    const body = await request.json();
    const data: { price?: number; durationInDays?: number; status?: PlanStatus } = {};
    if (typeof body.price === "number" && body.price >= 0) data.price = body.price;
    if (typeof body.durationInDays === "number" && body.durationInDays > 0) data.durationInDays = body.durationInDays;
    if (body.status === "ACTIVE" || body.status === "INACTIVE") data.status = body.status as PlanStatus;

    const plan = await prisma.subscriptionPlan.update({
      where: { id: planIdNum },
      data: {
        ...(data.price !== undefined && { price: data.price }),
        ...(data.durationInDays !== undefined && { durationInDays: data.durationInDays }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });
    return successResponse({
      id: plan.id,
      name: plan.name,
      price: Number(plan.price),
      durationInDays: plan.durationInDays,
      status: plan.status,
    }, "Plan updated");
  } catch (e) {
    console.error("PATCH plan", e);
    return errorResponse("Failed to update plan", 500);
  }
}
