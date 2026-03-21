import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
  forbiddenResponse,
} from "@/lib/api-response";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/** GET /api/admin/roles/[roleId]/permissions - Get permission IDs for a role. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { getCurrentUser } = await import("@/lib/api-auth");
    const { hasPermission } = await import("@/lib/permissions");
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (!user.permissions || !hasPermission(user.permissions, "permissions.manage")) return forbiddenResponse();

    const { roleId } = await params;
    const roleIdNum = parseInt(roleId, 10);
    if (Number.isNaN(roleIdNum)) return errorResponse("Invalid role ID", 400);

    const list = await prisma.rolePermission.findMany({
      where: { roleId: roleIdNum },
      select: { permissionId: true },
    });
    return successResponse(list.map((r) => r.permissionId));
  } catch (e) {
    console.error("GET role permissions", e);
    return errorResponse("Failed to fetch role permissions", 500);
  }
}

/** PUT /api/admin/roles/[roleId]/permissions - Set permissions for a role (SUPER_ADMIN only). */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const { roleId } = await params;
    const roleIdNum = parseInt(roleId, 10);
    if (Number.isNaN(roleIdNum)) return errorResponse("Invalid role ID", 400);

    const body = await request.json();
    const permissionIds: number[] = Array.isArray(body.permissionIds)
      ? body.permissionIds.map((id: unknown) => Number(id)).filter((n: number) => !Number.isNaN(n))
      : [];

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: roleIdNum } }),
      ...(permissionIds.length > 0
        ? [
            prisma.rolePermission.createMany({
              data: permissionIds.map((permissionId) => ({
                roleId: roleIdNum,
                permissionId,
              })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);

    return successResponse({ roleId: roleIdNum, permissionIds }, "Role permissions updated");
  } catch (e) {
    console.error("PUT role permissions", e);
    return errorResponse("Failed to update role permissions", 500);
  }
}
