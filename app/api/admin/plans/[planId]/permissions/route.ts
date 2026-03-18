import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  forbiddenResponse,
} from "@/lib/api-response";
import { requireSuperAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/** GET /api/admin/plans/[planId]/permissions - Get permission IDs for a plan. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { getCurrentUser } = await import("@/lib/api-auth");
    const { hasPermission, ROLES } = await import("@/lib/permissions");
    const user = await getCurrentUser();
    if (!user) return (await import("@/lib/api-response")).unauthorizedResponse();
    const isSuperAdmin = Number(user.roleId) === ROLES.SUPER_ADMIN;
    const canView = isSuperAdmin || (user.permissions && hasPermission(user.permissions, "subscription.plans.view"));
    if (!canView) return forbiddenResponse();

    const { planId } = await params;
    const planIdNum = parseInt(planId, 10);
    if (Number.isNaN(planIdNum)) return errorResponse("Invalid plan ID", 400);

    const list = await prisma.planPermission.findMany({
      where: { planId: planIdNum },
      select: { permissionId: true },
    });
    return successResponse(list.map((p) => p.permissionId));
  } catch (e) {
    console.error("GET plan permissions", e);
    return errorResponse("Failed to fetch plan permissions", 500);
  }
}

/** PUT /api/admin/plans/[planId]/permissions - Set permissions for a plan (SUPER_ADMIN only). */
export async function PUT(
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
    const permissionIds: number[] = Array.isArray(body.permissionIds)
      ? body.permissionIds.map((id: unknown) => Number(id)).filter((n: number) => !Number.isNaN(n))
      : [];

    await prisma.$transaction([
      prisma.planPermission.deleteMany({ where: { planId: planIdNum } }),
      ...(permissionIds.length > 0
        ? [
            prisma.planPermission.createMany({
              data: permissionIds.map((permissionId) => ({
                planId: planIdNum,
                permissionId,
              })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);

    return successResponse({ planId: planIdNum, permissionIds }, "Plan permissions updated");
  } catch (e) {
    console.error("PUT plan permissions", e);
    return errorResponse("Failed to update plan permissions", 500);
  }
}
